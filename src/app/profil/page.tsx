"use client";

import { useRouter } from "next/navigation";
import { MapPin, Heart, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/shared";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export default function ProfilPage() {
  const router = useRouter();
  const { user } = useApp();

  const handleResetOnboarding = () => {
    router.push("/onboarding");
  };

  return (
    <div className="px-5 pt-8">
      <div className="flex flex-col items-center text-center">
        <Avatar name={user.full_name} size="lg" />
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">{user.full_name}</h1>
        <p className="text-sm text-stone-500">{user.email}</p>
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-stone-400" />
            <div>
              <p className="text-sm font-medium text-stone-900">{user.city}</p>
              <p className="text-xs text-stone-400">Ville</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Heart className="mt-0.5 h-4 w-4 text-stone-400" />
            <div>
              <p className="text-xs text-stone-400 mb-1.5">Centres d&apos;intérêt</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map((i) => (
                  <Badge key={i} variant="accent">{i}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-stone-400" />
            <div>
              <p className="text-xs text-stone-400 mb-1.5">Quartiers préférés</p>
              <div className="flex flex-wrap gap-1.5">
                {user.preferred_areas.map((a) => (
                  <Badge key={a}>{a}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-4 w-4 text-stone-400" />
            <div>
              <p className="text-xs text-stone-400 mb-1.5">Préférences sociales</p>
              <div className="space-y-1 text-sm text-stone-600">
                {user.social_preferences.group_size && (
                  <p>Groupe : {user.social_preferences.group_size}</p>
                )}
                {user.social_preferences.spontaneity && (
                  <p>Spontanéité : {user.social_preferences.spontaneity}</p>
                )}
                {user.social_preferences.budget && (
                  <p>Budget : {user.social_preferences.budget}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="mt-6 w-full text-stone-500"
        onClick={handleResetOnboarding}
      >
        <LogOut className="h-4 w-4" />
        Modifier mon profil
      </Button>
    </div>
  );
}
