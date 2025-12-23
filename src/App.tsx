import { Analytics } from "@vercel/analytics/react";

import { useEffect, useMemo, useState } from "react";
import { Copy, CopyCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ClearableField } from "@/components/clearable-field";
import { useLocalStorageStringState } from "@/lib/local-storage";
import { generateTokenV2, parseBodyData, parseQueryParams } from "@/lib/token";

const LS_QUERY_PARAMS = "token-v2-generator.queryParams";
const LS_BODY_DATA = "token-v2-generator.bodyData";
const LS_TOKEN = "token-v2-generator.token";
const LS_API_SHARE_KEY = "token-v2-generator.apiShareKey";

export function App() {
  const [queryParamsText, setQueryParamsText] =
    useLocalStorageStringState(LS_QUERY_PARAMS);
  const [bodyDataText, setBodyDataText] =
    useLocalStorageStringState(LS_BODY_DATA);
  const [token, setToken] = useLocalStorageStringState(LS_TOKEN);
  const [apiShareKey, setApiShareKey] =
    useLocalStorageStringState(LS_API_SHARE_KEY);

  const [generatedToken, setGeneratedToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const queryParamsParse = useMemo(() => {
    try {
      return {
        value: parseQueryParams(queryParamsText),
        error: null as string | null,
      };
    } catch (e) {
      return {
        value: undefined,
        error: e instanceof Error ? e.message : "Invalid query params",
      };
    }
  }, [queryParamsText]);

  const bodyDataParse = useMemo(() => {
    try {
      return {
        value: parseBodyData(bodyDataText),
        error: null as string | null,
      };
    } catch (e) {
      return {
        value: undefined,
        error: e instanceof Error ? e.message : "Invalid body data",
      };
    }
  }, [bodyDataText]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsGenerating(true);
      setError(null);

      try {
        const out = await generateTokenV2({
          queryParams: queryParamsParse.value,
          bodyData: bodyDataParse.value,
          bearerToken: token,
          apiShareKey,
        });
        if (!cancelled) setGeneratedToken(out);
      } catch (e) {
        if (!cancelled) {
          setGeneratedToken("");
          setError(e instanceof Error ? e.message : "Failed to generate token");
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    // Don’t spam errors while fields are empty.
    if (!token.trim() || !apiShareKey.trim()) {
      setGeneratedToken("");
      setError(null);
      setIsGenerating(false);
      return;
    }

    if (queryParamsParse.error || bodyDataParse.error) {
      setGeneratedToken("");
      setError(queryParamsParse.error ?? bodyDataParse.error);
      setIsGenerating(false);
      return;
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [queryParamsParse, bodyDataParse, token, apiShareKey]);

  async function onCopy() {
    if (!generatedToken) return;

    try {
      await navigator.clipboard.writeText(generatedToken);
    } catch {
      const el = document.createElement("textarea");
      el.value = generatedToken;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold leading-tight">
            Token v2 generator
          </h1>
          <p className="text-muted-foreground text-sm">
            Fill the inputs on the left to generate a token.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Provide values used to generate the token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClearableField
                kind="textarea"
                id="query-params"
                label="Query params"
                value={queryParamsText}
                onChange={setQueryParamsText}
                onClear={() => setQueryParamsText("")}
                placeholder="Example: a=1&b=2"
                textareaClassName="min-h-24"
              />

              <ClearableField
                kind="textarea"
                id="body-data"
                label="Body data"
                value={bodyDataText}
                onChange={setBodyDataText}
                onClear={() => setBodyDataText("")}
                placeholder='Example: {"userId":123,"role":"admin"}'
                textareaClassName="min-h-24"
              />

              <ClearableField
                kind="input"
                id="token"
                label="Token"
                value={token}
                onChange={setToken}
                onClear={() => setToken("")}
                placeholder="Paste your token"
              />

              <ClearableField
                kind="input"
                id="api-share-key"
                label="API share key"
                value={apiShareKey}
                onChange={setApiShareKey}
                onClear={() => setApiShareKey("")}
                placeholder="Enter API share key"
              />
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated token</CardTitle>
              <CardDescription>
                {isGenerating
                  ? "Generating…"
                  : generatedToken
                  ? "Ready to copy."
                  : "Enter Token + API share key to generate."}
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCopy}
                  disabled={!generatedToken}
                >
                  {copied ? (
                    <>
                      <CopyCheck /> Copied
                    </>
                  ) : (
                    <>
                      <Copy /> Copy
                    </>
                  )}
                </Button>
              </CardAction>
            </CardHeader>

            <CardContent className="flex h-full flex-col gap-2">
              <Textarea
                value={generatedToken}
                readOnly
                placeholder="Your generated token will appear here"
                className="min-h-60 flex-1 font-mono"
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* For showing analytics on vercel project dashboard */}
      <Analytics />
    </div>
  );
}

export default App;
