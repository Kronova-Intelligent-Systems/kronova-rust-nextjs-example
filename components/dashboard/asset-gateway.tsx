"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Upload,
  Database,
  Brain,
  FileText,
  ImageIcon,
  Network,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
  Shield,
  Plus,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  importFromCSV,
  importFromExcel,
  importFromJSON,
  importFromDatabase,
  importFromAPI,
} from "@/lib/asset-import/traditional-importers"
import { importFromVectorDB, importFromDocuments, importFromImages } from "@/lib/asset-import/ai-importers"
import {
  importFromLinea,
  importFromSui,
  importFromCanton,
  importFromBitcoin,
  importFromEthereum,
} from "@/lib/asset-import/blockchain-importers"
import {
  useCreatePlaidLinkToken,
  useExchangePlaidPublicToken,
  useGetPlaidAccounts,
  useDisconnectPlaidAccount,
} from "@/lib/rspc/hooks"
import { createClient } from "@/lib/supabase/client" // Added for Supabase client

export function AssetGateway() {
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<any>(null)

  // Traditional Import States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dbConfig, setDbConfig] = useState({
    type: "postgresql" as "postgresql" | "mysql" | "mongodb",
    host: "",
    port: 5432,
    database: "",
    username: "",
    password: "",
    query: "",
  })
  const [apiConfig, setApiConfig] = useState({
    url: "",
    method: "GET" as "GET" | "POST",
    authType: "none" as "none" | "bearer" | "apikey" | "basic",
    authToken: "",
    dataPath: "",
  })

  // AI Import States
  const [vectorDbConfig, setVectorDbConfig] = useState({
    provider: "pinecone" as "pinecone" | "weaviate" | "qdrant",
    apiKey: "",
    endpoint: "",
    index: "",
    namespace: "",
    limit: 100,
  })
  const [aiDocuments, setAiDocuments] = useState<File[]>([])
  const [aiImages, setAiImages] = useState<File[]>([])

  // Blockchain Import States
  const [blockchainConfig, setBlockchainConfig] = useState({
    network: "ethereum" as "ethereum" | "bitcoin" | "linea" | "sui" | "canton",
    walletAddress: "",
    contractAddress: "",
    privateKey: "",
    importType: "balance" as "balance" | "erc20" | "erc721" | "nft" | "token" | "objects" | "contract_data" | "utxo",
  })

  // Import Options
  const [importOptions, setImportOptions] = useState({
    validateOnly: false,
    skipDuplicates: true,
    updateExisting: false,
  })

  // Plaid bank account integration states
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null)
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [plaidReady, setPlaidReady] = useState(false)
  const [isProcessingConnection, setIsProcessingConnection] = useState(false)

  // Plaid hooks
  const createLinkToken = useCreatePlaidLinkToken()
  const exchangePublicToken = useExchangePlaidPublicToken()
  const getAccounts = useGetPlaidAccounts()
  const disconnectAccount = useDisconnectPlaidAccount()

  // Supabase client and user auth
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // Load user on mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoadingUser(false)
    }
    getUser()
  }, [])

  useEffect(() => {
    const checkPlaidScript = () => {
      if (typeof window !== "undefined" && (window as any).Plaid) {
        console.log("[v0] Plaid script loaded successfully")
        setPlaidReady(true)
        return true
      }
      return false
    }

    // Check immediately
    if (checkPlaidScript()) return

    // If not loaded, set up polling with timeout
    let attempts = 0
    const maxAttempts = 50 // 5 seconds total
    const interval = setInterval(() => {
      attempts++
      if (checkPlaidScript()) {
        clearInterval(interval)
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        console.error("[v0] Plaid script failed to load after 5 seconds")
        toast({
          title: "Plaid Integration Error",
          description: "Failed to load Plaid. Please refresh the page.",
          variant: "destructive",
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [toast])

  useEffect(() => {
    if (plaidReady && plaidLinkToken && typeof window !== "undefined" && !isProcessingConnection) {
      console.log("[v0] Initializing Plaid Link with token:", plaidLinkToken)

      try {
        const handler = (window as any).Plaid.create({
          token: plaidLinkToken,
          onSuccess: async (public_token: string, metadata: any) => {
            console.log("[v0] Plaid Link success:", metadata)
            setIsProcessingConnection(true)
            setPlaidLinkToken(null) // Clear token immediately to prevent reopening

            // Exchange public token for access token
            try {
              const result = await exchangePublicToken.mutateAsync({
                publicToken: public_token,
                institutionId: metadata.institution?.institution_id,
                institutionName: metadata.institution?.name,
                accounts: metadata.accounts,
              })

              if (result.success) {
                toast({
                  title: "Bank Account Connected",
                  description: `Successfully connected to ${metadata.institution?.name}`,
                })

                // Fetch accounts for the connected institution
                await loadConnectedAccounts(result.item_id)
              }
            } catch (error) {
              console.error("[v0] Error exchanging token:", error)
              toast({
                title: "Connection Failed",
                description: "Failed to connect bank account. Please try again.",
                variant: "destructive",
              })
            } finally {
              setIsProcessingConnection(false)
            }
          },
          onExit: (err: any, metadata: any) => {
            console.log("[v0] Plaid Link exited:", err, metadata)
            if (err) {
              console.error("[v0] Plaid Link error:", err)
              toast({
                title: "Connection Cancelled",
                description: err.display_message || "Bank connection was cancelled",
                variant: "destructive",
              })
            }
            // Only clear token if not already processing to avoid race condition
            if (!isProcessingConnection) {
              setPlaidLinkToken(null)
            }
          },
        })

        console.log("[v0] Opening Plaid Link modal")
        handler.open()
      } catch (error) {
        console.error("[v0] Error creating Plaid handler:", error)
        toast({
          title: "Initialization Error",
          description: "Failed to open bank connection dialog. Please try again.",
          variant: "destructive",
        })
        setPlaidLinkToken(null)
      }
    }
  }, [plaidReady, plaidLinkToken, exchangePublicToken, toast, isProcessingConnection])

  useEffect(() => {
    if (!isLoadingUser && user?.id) {
      loadAllAccounts()
    }
  }, [user?.id, isLoadingUser])

  const loadAllAccounts = async () => {
    try {
      setLoadingAccounts(true)
      console.log("[v0] Loading all Plaid connections for user:", user?.id)

      // Fetch all active connections
      const { data: connections, error } = await supabase
        .from("plaid_connections")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")

      if (error) {
        console.error("[v0] Error loading connections:", error)
        return
      }

      if (connections && connections.length > 0) {
        console.log("[v0] Found", connections.length, "connections")

        // Load accounts for each connection in parallel
        const accountPromises = connections.map(async (conn) => {
          try {
            const result = await getAccounts.mutateAsync({ itemId: conn.item_id })
            console.log("[v0] Loaded accounts for", conn.institution_name, ":", result.data?.accounts?.length)

            if (result.data?.accounts) {
              return result.data.accounts.map((acc: any) => ({
                ...acc,
                institution_name: conn.institution_name,
                institution_id: conn.institution_id,
              }))
            }
            return []
          } catch (error) {
            console.error(`[v0] Error loading accounts for ${conn.institution_name}:`, error)
            return []
          }
        })

        const accountArrays = await Promise.all(accountPromises)
        const allAccounts = accountArrays.flat()

        console.log("[v0] Total accounts loaded:", allAccounts.length)
        setConnectedAccounts(allAccounts)
      } else {
        console.log("[v0] No connections found")
        setConnectedAccounts([])
      }
    } catch (error) {
      console.error("[v0] Error in loadAllAccounts:", error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleTraditionalImport = async (type: "csv" | "excel" | "json" | "database" | "api") => {
    setImporting(true)
    setProgress(0)
    setImportResult(null)

    try {
      let result

      if (type === "csv" && selectedFiles[0]) {
        result = await importFromCSV(selectedFiles[0], { userId: "current-user", ...importOptions })
      } else if (type === "excel" && selectedFiles[0]) {
        result = await importFromExcel(selectedFiles[0], { userId: "current-user", ...importOptions })
      } else if (type === "json" && selectedFiles[0]) {
        result = await importFromJSON(selectedFiles[0], { userId: "current-user", ...importOptions })
      } else if (type === "database") {
        result = await importFromDatabase(dbConfig, { userId: "current-user", ...importOptions })
      } else if (type === "api") {
        result = await importFromAPI(apiConfig, { userId: "current-user", ...importOptions })
      }

      setProgress(100)
      setImportResult(result)

      toast({
        title: result?.success ? "Import Successful" : "Import Completed with Errors",
        description: `Imported: ${result?.imported || 0}, Failed: ${result?.failed || 0}`,
        variant: result?.success ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleAIImport = async (type: "vector_db" | "documents" | "images") => {
    setImporting(true)
    setProgress(0)
    setImportResult(null)

    try {
      console.log(`[v0] Starting ${type} import with config:`, type === "vector_db" ? vectorDbConfig : null)
      
      let result

      if (type === "vector_db") {
        result = await importFromVectorDB(vectorDbConfig, { userId: "current-user" })
      } else if (type === "documents") {
        result = await importFromDocuments(aiDocuments, { userId: "current-user" })
      } else if (type === "images") {
        result = await importFromImages(aiImages, { userId: "current-user" })
      }

      console.log(`[v0] Import result:`, result)
      
      setProgress(100)
      setImportResult(result)

      if (result?.errors && result.errors.length > 0) {
        console.error(`[v0] Import completed with ${result.errors.length} errors:`, result.errors)
      }

      toast({
        title: result?.success ? "AI Import Successful" : "AI Import Completed with Errors",
        description: `Imported: ${result?.imported || 0}, Failed: ${result?.failed || 0}`,
        variant: result?.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("[v0] AI Import error:", error)
      toast({
        title: "AI Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleBlockchainImport = async () => {
    setImporting(true)
    setProgress(0)
    setImportResult(null)

    try {
      let result

      if (blockchainConfig.network === "ethereum") {
        result = await importFromEthereum(
          {
            address: blockchainConfig.walletAddress,
            contractAddress: blockchainConfig.contractAddress,
            importType: blockchainConfig.importType as any,
          },
          { userId: "current-user" },
        )
      } else if (blockchainConfig.network === "linea") {
        result = await importFromLinea(
          {
            walletAddress: blockchainConfig.walletAddress,
            contractAddress: blockchainConfig.contractAddress,
            privateKey: blockchainConfig.privateKey,
            importType: blockchainConfig.importType as any,
          },
          { userId: "current-user" },
        )
      } else if (blockchainConfig.network === "bitcoin") {
        result = await importFromBitcoin(
          {
            address: blockchainConfig.walletAddress,
            importType: blockchainConfig.importType as any,
          },
          { userId: "current-user" },
        )
      } else if (blockchainConfig.network === "sui") {
        result = await importFromSui(
          {
            walletAddress: blockchainConfig.walletAddress,
            importType: blockchainConfig.importType as any,
          },
          { userId: "current-user" },
        )
      } else if (blockchainConfig.network === "canton") {
        result = await importFromCanton(
          {
            participantUrl: blockchainConfig.contractAddress,
            apiToken: blockchainConfig.privateKey,
            partyId: blockchainConfig.walletAddress,
          },
          { userId: "current-user" },
        )
      }

      setProgress(100)
      setImportResult(result)

      toast({
        title: result?.success ? "Blockchain Import Successful" : "Blockchain Import Completed with Errors",
        description: `Imported: ${result?.imported || 0}, Failed: ${result?.failed || 0}`,
        variant: result?.success ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "Blockchain Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleConnectBank = async () => {
    try {
      setLoadingAccounts(true)
      console.log("[v0] Creating Plaid link token...")
      const result = await createLinkToken.mutateAsync({
        products: ["transactions", "auth"],
        country_codes: ["US"],
        language: "en",
      })

      console.log("[v0] Link token result:", result)

      if (result.link_token) {
        console.log("[v0] Setting link token:", result.link_token)
        setPlaidLinkToken(result.link_token)
      } else {
        throw new Error("No link token returned")
      }
    } catch (error) {
      console.error("[v0] Error creating link token:", error)
      toast({
        title: "Connection Error",
        description: "Failed to initialize bank connection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingAccounts(false)
    }
  }

  const loadConnectedAccounts = async (itemId: string) => {
    try {
      setLoadingAccounts(true)
      console.log("[v0] Loading accounts for item:", itemId)
      const result = await getAccounts.mutateAsync({ itemId })

      if (result.data?.accounts) {
        console.log("[v0] Loaded accounts:", result.data.accounts.length)

        // Get institution name from plaid_connections
        const { data: connection } = await supabase
          .from("plaid_connections")
          .select("institution_name")
          .eq("item_id", itemId)
          .single()

        const accountsWithInstitution = result.data.accounts.map((acc: any) => ({
          ...acc,
          institution_name: connection?.institution_name,
        }))

        setConnectedAccounts((prev) => {
          // Merge with existing accounts, avoiding duplicates
          const existing = prev.filter((acc) => acc.item_id !== itemId)
          return [...existing, ...accountsWithInstitution]
        })
      }
    } catch (error) {
      console.error("[v0] Error loading accounts:", error)
      toast({
        title: "Load Error",
        description: "Failed to load bank accounts",
        variant: "destructive",
      })
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleDisconnectBank = async (itemId: string) => {
    try {
      await disconnectAccount.mutateAsync({ itemId })
      setConnectedAccounts(connectedAccounts.filter((acc) => acc.item_id !== itemId))

      toast({
        title: "Account Disconnected",
        description: "Bank account has been disconnected successfully",
      })
    } catch (error) {
      console.error("[v0] Error disconnecting account:", error)
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect bank account",
        variant: "destructive",
      })
    }
  }

  const handleImportBankAccounts = async () => {
    if (connectedAccounts.length === 0) {
      toast({
        title: "No Accounts",
        description: "Please connect a bank account first",
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    setProgress(0)
    setImportResult(null)

    try {
      // Import bank accounts as assets
      const importedAssets = connectedAccounts.map((account) => ({
        asset_id: `bank_${account.account_id}`,
        name: account.name || account.official_name,
        asset_type: "financial_account",
        category: `${account.type}_${account.subtype}`,
        description: `${account.type} account ending in ${account.mask}`,
        current_value: account.balances.current,
        status: "active",
        specifications: {
          account_id: account.account_id,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balances: account.balances,
        },
        metadata: {
          source: "plaid",
          imported_at: new Date().toISOString(),
        },
      }))

      // Simulate import process
      setProgress(50)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProgress(100)

      setImportResult({
        success: true,
        imported: importedAssets.length,
        failed: 0,
        data: importedAssets,
      })

      toast({
        title: "Import Successful",
        description: `Imported ${importedAssets.length} bank account(s) as assets`,
      })
    } catch (error) {
      console.error("[v0] Error importing bank accounts:", error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-[3dvw] md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Asset Gateway</h2>
        <p className="text-muted-foreground">
          Import assets from traditional databases, AI systems, blockchain networks, and financial institutions
        </p>
      </div>

      <Tabs defaultValue="traditional" className="space-y-[3dvw] md:space-y-4">
        <TabsList className="grid w-full grid-cols-4 gap-[2dvw] md:gap-0">
          <TabsTrigger value="traditional" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Traditional</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI & ML</span>
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">Blockchain</span>
          </TabsTrigger>
          <TabsTrigger value="banking" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Banking</span>
          </TabsTrigger>
        </TabsList>

        {/* Traditional Import Methods */}
        <TabsContent value="traditional" className="space-y-[3dvw] md:space-y-4">
          <Tabs defaultValue="file" className="space-y-[3dvw] md:space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <Card>
                <CardHeader>
                  <CardTitle>File Upload</CardTitle>
                  <CardDescription>Import assets from CSV, Excel, or JSON files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-[3dvw] md:space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-[4dvw] md:p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">Supports CSV, Excel, and JSON formats</p>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files</Label>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <Badge variant="secondary">{(file.size / 1024).toFixed(2)} KB</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-[2dvw] md:gap-2">
                    <Button
                      onClick={() => handleTraditionalImport("csv")}
                      disabled={importing || selectedFiles.length === 0}
                      className="flex-1"
                    >
                      {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Import CSV
                    </Button>
                    <Button
                      onClick={() => handleTraditionalImport("excel")}
                      disabled={importing || selectedFiles.length === 0}
                      className="flex-1"
                    >
                      {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Import Excel
                    </Button>
                    <Button
                      onClick={() => handleTraditionalImport("json")}
                      disabled={importing || selectedFiles.length === 0}
                      className="flex-1"
                    >
                      {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Import JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle>Database Connection</CardTitle>
                  <CardDescription>Connect to PostgreSQL, MySQL, or MongoDB</CardDescription>
                </CardHeader>
                <CardContent className="space-y-[3dvw] md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[3dvw] md:gap-4">
                    <div className="space-y-2">
                      <Label>Database Type</Label>
                      <Select
                        value={dbConfig.type}
                        onValueChange={(value: any) => setDbConfig({ ...dbConfig, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="mongodb">MongoDB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Host</Label>
                      <Input
                        value={dbConfig.host}
                        onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                        placeholder="localhost"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input
                        type="number"
                        value={dbConfig.port}
                        onChange={(e) => setDbConfig({ ...dbConfig, port: Number.parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Database</Label>
                      <Input
                        value={dbConfig.database}
                        onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={dbConfig.username}
                        onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={dbConfig.password}
                        onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Query</Label>
                    <Textarea
                      value={dbConfig.query}
                      onChange={(e) => setDbConfig({ ...dbConfig, query: e.target.value })}
                      placeholder="SELECT * FROM assets"
                      rows={4}
                    />
                  </div>

                  <Button onClick={() => handleTraditionalImport("database")} disabled={importing} className="w-full">
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Import from Database
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <CardTitle>API Integration</CardTitle>
                  <CardDescription>Import assets from REST APIs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-[3dvw] md:space-y-4">
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Input
                      value={apiConfig.url}
                      onChange={(e) => setApiConfig({ ...apiConfig, url: e.target.value })}
                      placeholder="https://api.example.com/assets"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[3dvw] md:gap-4">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select
                        value={apiConfig.method}
                        onValueChange={(value: any) => setApiConfig({ ...apiConfig, method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Authentication</Label>
                      <Select
                        value={apiConfig.authType}
                        onValueChange={(value: any) => setApiConfig({ ...apiConfig, authType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="apikey">API Key</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {apiConfig.authType !== "none" && (
                    <div className="space-y-2">
                      <Label>Auth Token</Label>
                      <Input
                        type="password"
                        value={apiConfig.authToken}
                        onChange={(e) => setApiConfig({ ...apiConfig, authToken: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Data Path (Optional)</Label>
                    <Input
                      value={apiConfig.dataPath}
                      onChange={(e) => setApiConfig({ ...apiConfig, dataPath: e.target.value })}
                      placeholder="data.assets"
                    />
                    <p className="text-xs text-muted-foreground">JSONPath to extract data from response</p>
                  </div>

                  <Button onClick={() => handleTraditionalImport("api")} disabled={importing} className="w-full">
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Import from API
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* AI & ML Import Methods */}
        <TabsContent value="ai" className="space-y-[3dvw] md:space-y-4">
          <Tabs defaultValue="vector" className="space-y-[3dvw] md:space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="vector">Vector DB</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="vector">
              <Card>
                <CardHeader>
                  <CardTitle>Vector Database Import</CardTitle>
                  <CardDescription>Import from Pinecone, Weaviate, or Qdrant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-[3dvw] md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[3dvw] md:gap-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select
                        value={vectorDbConfig.provider}
                        onValueChange={(value: any) => setVectorDbConfig({ ...vectorDbConfig, provider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pinecone">Pinecone</SelectItem>
                          <SelectItem value="weaviate">Weaviate</SelectItem>
                          <SelectItem value="qdrant">Qdrant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={vectorDbConfig.apiKey}
                        onChange={(e) => setVectorDbConfig({ ...vectorDbConfig, apiKey: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Endpoint</Label>
                      <Input
                        value={vectorDbConfig.endpoint}
                        onChange={(e) => setVectorDbConfig({ ...vectorDbConfig, endpoint: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Index/Collection</Label>
                      <Input
                        value={vectorDbConfig.index}
                        onChange={(e) => setVectorDbConfig({ ...vectorDbConfig, index: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleAIImport("vector_db")} disabled={importing} className="w-full">
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Import from Vector DB
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>AI Document Extraction</CardTitle>
                  <CardDescription>Extract asset data from documents using AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-[3dvw] md:space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-[4dvw] md:p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      multiple
                      onChange={(e) => setAiDocuments(Array.from(e.target.files || []))}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">Upload PDF, Word, or text documents</p>
                  </div>

                  {aiDocuments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Documents ({aiDocuments.length})</Label>
                      {aiDocuments.slice(0, 3).map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                        </div>
                      ))}
                      {aiDocuments.length > 3 && (
                        <p className="text-sm text-muted-foreground">+{aiDocuments.length - 3} more</p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => handleAIImport("documents")}
                    disabled={importing || aiDocuments.length === 0}
                    className="w-full"
                  >
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Extract with AI
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle>AI Image Recognition</CardTitle>
                  <CardDescription>Identify assets from images using computer vision</CardDescription>
                </CardHeader>
                <CardContent className="space-y-[3dvw] md:space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-[4dvw] md:p-8 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setAiImages(Array.from(e.target.files || []))}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">Upload images of assets</p>
                  </div>

                  {aiImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {aiImages.slice(0, 6).map((file, idx) => (
                        <div key={idx} className="aspect-square border rounded overflow-hidden">
                          <img
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => handleAIImport("images")}
                    disabled={importing || aiImages.length === 0}
                    className="w-full"
                  >
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Recognize Assets
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Blockchain Import Methods */}
        <TabsContent value="blockchain" className="space-y-[3dvw] md:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Asset Import</CardTitle>
              <CardDescription>Import assets from Bitcoin, Linea, Sui, Canton, and Ethereum networks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-[3dvw] md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[3dvw] md:gap-4">
                <div className="space-y-2">
                  <Label>Blockchain Network</Label>
                  <Select
                    value={blockchainConfig.network}
                    onValueChange={(value: any) => setBlockchainConfig({ ...blockchainConfig, network: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="bitcoin">Bitcoin</SelectItem>
                      <SelectItem value="linea">Linea</SelectItem>
                      <SelectItem value="sui">Sui</SelectItem>
                      <SelectItem value="canton">Canton</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Import Type</Label>
                  <Select
                    value={blockchainConfig.importType}
                    onValueChange={(value: any) => setBlockchainConfig({ ...blockchainConfig, importType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blockchainConfig.network === "ethereum" && (
                        <>
                          <SelectItem value="balance">ETH Balance</SelectItem>
                          <SelectItem value="erc20">ERC-20 Tokens</SelectItem>
                          <SelectItem value="erc721">ERC-721 NFTs</SelectItem>
                        </>
                      )}
                      {blockchainConfig.network === "bitcoin" && (
                        <>
                          <SelectItem value="utxo">Balance & UTXOs</SelectItem>
                        </>
                      )}
                      {blockchainConfig.network === "linea" && (
                        <>
                          <SelectItem value="nft">NFTs</SelectItem>
                          <SelectItem value="token">Tokens</SelectItem>
                          <SelectItem value="contract_data">Contract Data</SelectItem>
                        </>
                      )}
                      {blockchainConfig.network === "sui" && (
                        <>
                          <SelectItem value="objects">Objects</SelectItem>
                          <SelectItem value="nfts">NFTs</SelectItem>
                          <SelectItem value="tokens">Tokens</SelectItem>
                        </>
                      )}
                      {blockchainConfig.network === "canton" && (
                        <SelectItem value="contract_data">Contracts</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {blockchainConfig.network === "bitcoin"
                      ? "Bitcoin Address"
                      : blockchainConfig.network === "ethereum"
                        ? "Ethereum Address"
                        : "Wallet Address"}
                  </Label>
                  <Input
                    value={blockchainConfig.walletAddress}
                    onChange={(e) => setBlockchainConfig({ ...blockchainConfig, walletAddress: e.target.value })}
                    placeholder={
                      blockchainConfig.network === "bitcoin"
                        ? "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                        : blockchainConfig.network === "ethereum"
                          ? "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                          : "0x..."
                    }
                  />
                </div>

                {(blockchainConfig.network === "ethereum" &&
                  (blockchainConfig.importType === "erc20" || blockchainConfig.importType === "erc721")) ||
                (blockchainConfig.network === "linea" &&
                  blockchainConfig.network !== "sui" &&
                  blockchainConfig.network !== "bitcoin") ? (
                  <div className="space-y-2">
                    <Label>Contract Address</Label>
                    <Input
                      value={blockchainConfig.contractAddress}
                      onChange={(e) => setBlockchainConfig({ ...blockchainConfig, contractAddress: e.target.value })}
                      placeholder="0x..."
                    />
                  </div>
                ) : null}
              </div>

              <Button onClick={handleBlockchainImport} disabled={importing} className="w-full">
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Import from Blockchain
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Integration Tab */}
        <TabsContent value="banking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Integration</CardTitle>
              <CardDescription>
                Connect your bank accounts securely via Plaid to import financial data as assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 md:p-4 bg-muted rounded-lg border">
                <div className="flex items-start gap-2 md:gap-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-xs md:text-sm min-w-0">
                    <p className="font-medium mb-1">Bank-Level Security</p>
                    <p className="text-muted-foreground">
                      Your credentials are never stored. All connections use OAuth with 256-bit AES encryption.
                    </p>
                  </div>
                </div>
              </div>

              {connectedAccounts.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 md:p-8 border-2 border-dashed rounded-lg">
                  <Building2 className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-2 text-center">Connect Your Bank Account</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center mb-4 max-w-md px-4">
                    Securely link your bank accounts to import balances, transactions, and financial data
                  </p>
                  <Button
                    onClick={handleConnectBank}
                    disabled={loadingAccounts || createLinkToken.isPending}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {loadingAccounts || createLinkToken.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Connect Bank Account
                  </Button>
                </div>
              )}

              {connectedAccounts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-sm md:text-base">Connected Accounts ({connectedAccounts.length})</Label>
                    <Button
                      onClick={handleConnectBank}
                      disabled={loadingAccounts || createLinkToken.isPending}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Add Account</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {connectedAccounts.map((account, idx) => {
                      const getAccountIcon = () => {
                        const subtype = account.subtype?.toLowerCase() || ""
                        const type = account.type?.toLowerCase() || ""

                        if (subtype.includes("checking"))
                          return <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        if (subtype.includes("savings"))
                          return <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        if (subtype.includes("credit"))
                          return <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        if (type.includes("investment") || subtype.includes("brokerage"))
                          return <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        if (type.includes("loan") || subtype.includes("mortgage"))
                          return <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        return <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      }

                      return (
                        <Card key={account.account_id || idx} className="overflow-hidden">
                          <CardContent className="p-3 md:p-4">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="p-1.5 md:p-2 bg-primary/10 rounded flex-shrink-0">{getAccountIcon()}</div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-sm md:text-base truncate">
                                        {account.name || account.official_name || "Account"}
                                      </h4>
                                      {account.mask && (
                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                          ••{account.mask}
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                                      {account.institution_name && (
                                        <span className="font-medium">{account.institution_name}</span>
                                      )}
                                      <span className="capitalize">
                                        {account.type}
                                        {account.subtype && ` • ${account.subtype}`}
                                      </span>
                                    </div>

                                    <div className="mt-2">
                                      <div className="font-semibold text-base md:text-lg text-foreground">
                                        {new Intl.NumberFormat("en-US", {
                                          style: "currency",
                                          currency: account.balances?.iso_currency_code || "USD",
                                        }).format(account.balances?.current || 0)}
                                      </div>
                                      {account.balances?.available !== null &&
                                        account.balances?.available !== undefined &&
                                        account.balances?.available !== account.balances?.current && (
                                          <div className="text-xs text-muted-foreground">
                                            Available:{" "}
                                            {new Intl.NumberFormat("en-US", {
                                              style: "currency",
                                              currency: account.balances?.iso_currency_code || "USD",
                                            }).format(account.balances?.available)}
                                          </div>
                                        )}
                                      {account.balances?.limit && (
                                        <div className="text-xs text-muted-foreground">
                                          Credit Limit:{" "}
                                          {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: account.balances?.iso_currency_code || "USD",
                                          }).format(account.balances?.limit)}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDisconnectBank(account.item_id)}
                                    className="flex-shrink-0"
                                    title="Disconnect this account"
                                  >
                                    <X className="h-4 w-4" />
                                    <span className="hidden md:inline ml-1">Disconnect</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <Button
                    onClick={handleImportBankAccounts}
                    disabled={importing || connectedAccounts.length === 0}
                    className="w-full bg-transparent"
                    variant="outline"
                  >
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Import {connectedAccounts.length} Account{connectedAccounts.length !== 1 ? "s" : ""} as Assets
                  </Button>
                </div>
              )}

              {loadingAccounts && connectedAccounts.length === 0 && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Options */}
      <Card>
        <CardHeader>
          <CardTitle>Import Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-[3dvw] md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Validate Only</Label>
              <p className="text-sm text-muted-foreground">Check data without importing</p>
            </div>
            <Switch
              checked={importOptions.validateOnly}
              onCheckedChange={(checked) => setImportOptions({ ...importOptions, validateOnly: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Skip Duplicates</Label>
              <p className="text-sm text-muted-foreground">Skip assets that already exist</p>
            </div>
            <Switch
              checked={importOptions.skipDuplicates}
              onCheckedChange={(checked) => setImportOptions({ ...importOptions, skipDuplicates: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Update Existing</Label>
              <p className="text-sm text-muted-foreground">Update existing assets with new data</p>
            </div>
            <Switch
              checked={importOptions.updateExisting}
              onCheckedChange={(checked) => setImportOptions({ ...importOptions, updateExisting: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Import Progress */}
      {importing && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">{progress}% Complete</p>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-[3dvw] md:space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[3dvw] md:gap-4">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-muted-foreground">Imported</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{importResult.imported + importResult.failed}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">
                  {importResult.imported + importResult.failed > 0
                    ? Math.round((importResult.imported / (importResult.imported + importResult.failed)) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Errors ({importResult.errors.length})</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log("[v0] Full error details:", importResult.errors)
                      const errorText = importResult.errors
                        .map((e: any) => `Row ${e.row}: ${e.error}`)
                        .join("\n")
                      navigator.clipboard.writeText(errorText)
                      toast({
                        title: "Errors Copied",
                        description: "All error details copied to clipboard",
                      })
                    }}
                  >
                    Copy All Errors
                  </Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded p-2 bg-muted/50">
                  {importResult.errors.map((error: any, idx: number) => (
                    <div key={idx} className="p-2 border rounded text-sm bg-background">
                      <div className="font-medium text-destructive">Row {error.row}:</div>
                      <div className="mt-1 text-muted-foreground break-words">{error.error}</div>
                      {error.details && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-primary hover:underline">
                            View Details
                          </summary>
                          <pre className="mt-1 text-xs overflow-x-auto bg-muted p-2 rounded">
                            {typeof error.details === "string" ? error.details : JSON.stringify(error.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.insights && importResult.insights.length > 0 && (
              <div className="space-y-2">
                <Label>AI Insights</Label>
                <div className="space-y-2">
                  {importResult.insights.map((insight: any, idx: number) => (
                    <div key={idx} className="p-2 border rounded text-sm bg-blue-50">
                      {typeof insight === "string"
                        ? insight
                        : insight.action || insight.description || JSON.stringify(insight)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full bg-transparent" onClick={() => setImportResult(null)}>
              Close Results
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
