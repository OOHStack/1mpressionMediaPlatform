import { createClient } from "@/lib/supabase/server";
import { getStoredTokens, getLastSyncTime } from "@/lib/gmail";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft, Mail, CheckCircle, AlertCircle, Zap } from "lucide-react";
import GmailConnectPanel from "@/components/emails/GmailConnectPanel";

interface PageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

export const revalidate = 0;

export default async function EmailSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tokens = await getStoredTokens();
  const lastSync = await getLastSyncTime();
  const isConnected = !!tokens;
  const hasGoogleCreds = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasAiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/emails" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Email Intake
        </Link>
      </div>
      <PageHeader title="Email Settings" description="Gmail connection and AI extraction" />

      {params.connected === "true" && (
        <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2 text-sm text-green-800">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Gmail connected successfully.
        </div>
      )}
      {params.error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Error: {decodeURIComponent(params.error)}
        </div>
      )}

      {/* Gmail connection */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Gmail Connection</h2>
        </div>

        {!hasGoogleCreds ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <p className="font-semibold mb-2">Setup required</p>
            <ol className="space-y-1 list-decimal list-inside text-xs">
              <li>Go to <strong>console.cloud.google.com</strong> → New Project</li>
              <li>Enable the <strong>Gmail API</strong></li>
              <li>Create <strong>OAuth 2.0 credentials</strong> (Web App)</li>
              <li>Set authorized redirect URI: <code className="bg-amber-100 px-1 rounded">{process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback</code></li>
              <li>Copy the Client ID and Secret into <code className="bg-amber-100 px-1 rounded">.env.local</code></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        ) : (
          <GmailConnectPanel
            isConnected={isConnected}
            lastSync={lastSync}
          />
        )}
      </div>

      {/* AI settings */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">AI Extraction</h2>
        </div>

        {!hasAiKey ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <p className="font-semibold mb-2">Claude API key required</p>
            <ol className="space-y-1 list-decimal list-inside text-xs">
              <li>Get your API key from <strong>console.anthropic.com</strong></li>
              <li>Add <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY=sk-ant-...</code> to <code className="bg-amber-100 px-1 rounded">.env.local</code></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm text-gray-700">Claude API key configured — AI extraction is active.</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            When you open an email and click <strong>Run AI Extraction</strong>, Claude will analyze the email and extract:
            client name, company, campaign, market, shoot date, deadline, budget, deliverables, and missing info.
            It can also draft a client reply and flag unclear requests.
            <br /><br />
            AI never sends anything automatically. All output requires your review.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">How Gmail Sync Works</h2>
        <ol className="space-y-2 text-xs text-gray-600 list-decimal list-inside">
          <li>Click <strong>Connect Gmail</strong> and authorize read-only access to your inbox.</li>
          <li>Click <strong>Sync Now</strong> to pull recent emails into the Email Intake page.</li>
          <li>Open any email and click <strong>Run AI Extraction</strong> to auto-fill job fields.</li>
          <li>Review extracted fields, edit if needed, then click <strong>Convert to Job</strong>.</li>
          <li>The new job is pre-filled — finish filling in missing details and save.</li>
        </ol>
        <p className="text-xs text-gray-400 mt-3">
          Access is read-only. The app cannot send emails or modify your inbox.
        </p>
      </div>
    </div>
  );
}
