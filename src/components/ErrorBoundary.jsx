import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <Card className="p-8 sm:p-12 bg-white/5 border-white/10 text-center max-w-md">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              {this.props.fallbackMessage || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Link to={createPageUrl("Home")} className="flex-1">
                <Button variant="outline" className="w-full border-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}