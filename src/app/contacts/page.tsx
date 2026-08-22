"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, Avatar } from "@/components/shared";
import { useApp } from "@/lib/store";

export default function ContactsPage() {
  const { contacts, addContact } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [relationship, setRelationship] = useState("ami");

  const handleAdd = () => {
    if (!name.trim()) return;
    addContact({ name, email, relationship, neighborhood });
    setName("");
    setEmail("");
    setNeighborhood("");
    setShowForm(false);
  };

  return (
    <div className="px-5 pt-8">
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} contact${contacts.length > 1 ? "s" : ""}`}
      />

      <div className="space-y-3">
        {contacts.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar name={contact.name} />
              <div className="flex-1">
                <p className="font-medium text-stone-900">{contact.name}</p>
                <p className="text-sm text-stone-500">
                  {contact.neighborhood ?? contact.relationship}
                  {contact.email && ` · ${contact.email}`}
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                {contact.relationship}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm ? (
        <Card className="mt-4">
          <CardContent className="space-y-4 p-4">
            <div>
              <Label htmlFor="cname">Nom</Label>
              <Input id="cname" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cneighborhood">Quartier</Label>
              <Input id="cneighborhood" className="mt-1.5" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleAdd} disabled={!name.trim()}>
                Ajouter
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="accent" className="mt-6 w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un contact
        </Button>
      )}
    </div>
  );
}
