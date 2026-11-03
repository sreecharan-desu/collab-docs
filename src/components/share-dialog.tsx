"use client";

import { useState, useTransition } from "react";
import { shareDocumentAction, revokeShareAction } from "@/app/actions/documents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Share2, Trash2 } from "lucide-react";

type ShareRow = {
  id: string;
  role: "VIEWER" | "EDITOR";
  user: { name: string; email: string };
};

type Props = {
  documentId: string;
  shares: ShareRow[];
  canManage: boolean;
};

export function ShareDialog({ documentId, shares, canManage }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canManage) return null;

  const onShare = () => {
    setError(null);
    startTransition(async () => {
      const result = await shareDocumentAction(documentId, email, role);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEmail("");
      setError(null);
    });
  };

  const onRevoke = (shareId: string) => {
    startTransition(async () => {
      const result = await revokeShareAction(documentId, shareId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Invite someone by email as a viewer or editor. They need an account on this app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr,auto,auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-role">Role</Label>
              <select
                id="share-role"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")}
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
            <Button type="button" disabled={pending || !email} onClick={onShare}>
              Add
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">People with access</p>
            {shares.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Not shared with anyone yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {shares.map((share) => (
                  <li key={share.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{share.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{share.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {share.role === "EDITOR" ? "Editor" : "Viewer"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Revoke access for ${share.user.email}`}
                        disabled={pending}
                        onClick={() => onRevoke(share.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
