// Push notification utilities
export class NotificationManager {
  private static instance: NotificationManager
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  async initialize(): Promise<void> {
    if ("serviceWorker" in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Service Worker registered:", this.registration)
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return "denied"
    }

    if (Notification.permission === "granted") {
      return "granted"
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error("Service Worker not registered")
      return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
      })

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)
      return subscription
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      return null
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission()

    if (permission === "granted" && this.registration) {
      await this.registration.showNotification(title, {
        icon: "/icons/icon-192x192.jpg",
        badge: "/icons/icon-72x72.png",
        vibrate: [100, 50, 100],
        ...options,
      })
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      })
    } catch (error) {
      console.error("Failed to send subscription to server:", error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Notification types for AssetIQ
export interface AssetNotification {
  type: "asset_alert" | "maintenance_due" | "performance_warning"
  assetId: string
  assetName: string
  message: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
}

export interface AgentNotification {
  type: "agent_status" | "task_completed" | "error_occurred"
  agentId: string
  agentName: string
  message: string
  timestamp: string
}

export interface WorkflowNotification {
  type: "workflow_completed" | "workflow_failed" | "workflow_started"
  workflowId: string
  workflowName: string
  message: string
  timestamp: string
}

export type SystemNotification = AssetNotification | AgentNotification | WorkflowNotification
