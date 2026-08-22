"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const INTERESTS = [
  "Restaurants",
  "Expositions",
  "Apéros",
  "Sport",
  "Concerts",
  "Randonnée urbaine",
  "Cinéma",
  "Brunch",
];

const AREAS = [
  "Marais",
  "Bastille",
  "Canal Saint-Martin",
  "Montmartre",
  "République",
  "Oberkampf",
  "Saint-Germain",
  "Belleville",
];

const SOCIAL_PREFS = [
  { key: "group_size", label: "Taille de groupe", options: ["2-3 personnes", "4-6 personnes", "7+ personnes"] },
  { key: "spontaneity", label: "Spontanéité", options: ["planifié", "modéré", "spontané"] },
  { key: "budget", label: "Budget", options: ["économique", "moyen", "premium"] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUser } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Paris");
  const [interests, setInterests] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [socialPrefs, setSocialPrefs] = useState<Record<string, string>>({});

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleFinish = () => {
    updateUser({
      full_name: name,
      city,
      interests: interests.map((i) => i.toLowerCase()),
      preferred_areas: areas,
      social_preferences: socialPrefs,
      onboarding_completed: true,
    });
    router.push("/");
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E8DFD3]">
        <span className="text-3xl font-bold text-stone-900">H</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Hirnao</h1>
      <p className="mt-3 text-stone-500 max-w-xs">
        Organisez vos sorties entre amis et contacts pro, sans la galère des messages croisés.
      </p>
      <Button className="mt-10 w-full max-w-xs" size="lg" onClick={() => setStep(1)}>
        Commencer
      </Button>
    </div>,

    // Step 1: Name & City
    <div key="name" className="px-6 pt-12">
      <h2 className="text-2xl font-semibold text-stone-900">Faisons connaissance</h2>
      <p className="mt-2 text-stone-500">Comment vous appelez-vous et où habitez-vous ?</p>
      <div className="mt-8 space-y-5">
        <div>
          <Label htmlFor="name">Prénom et nom</Label>
          <Input id="name" className="mt-2" placeholder="Léa Martin" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input id="city" className="mt-2" placeholder="Paris" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>
      <Button className="mt-10 w-full" disabled={!name.trim()} onClick={() => setStep(2)}>
        Continuer
      </Button>
    </div>,

    // Step 2: Interests
    <div key="interests" className="px-6 pt-12">
      <h2 className="text-2xl font-semibold text-stone-900">Vos centres d&apos;intérêt</h2>
      <p className="mt-2 text-stone-500">Sélectionnez ce qui vous plaît</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {INTERESTS.map((item) => (
          <button
            key={item}
            onClick={() => toggleItem(interests, item, setInterests)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              interests.includes(item)
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <Button className="mt-10 w-full" disabled={interests.length === 0} onClick={() => setStep(3)}>
        Continuer
      </Button>
    </div>,

    // Step 3: Preferred areas
    <div key="areas" className="px-6 pt-12">
      <h2 className="text-2xl font-semibold text-stone-900">Vos quartiers préférés</h2>
      <p className="mt-2 text-stone-500">Où aimez-vous sortir ?</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {AREAS.map((item) => (
          <button
            key={item}
            onClick={() => toggleItem(areas, item, setAreas)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              areas.includes(item)
                ? "bg-[#E8DFD3] text-stone-900"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <Button className="mt-10 w-full" disabled={areas.length === 0} onClick={() => setStep(4)}>
        Continuer
      </Button>
    </div>,

    // Step 4: Social preferences
    <div key="social" className="px-6 pt-12">
      <h2 className="text-2xl font-semibold text-stone-900">Vos préférences sociales</h2>
      <p className="mt-2 text-stone-500">Aidez-nous à mieux vous connaître</p>
      <div className="mt-8 space-y-6">
        {SOCIAL_PREFS.map(({ key, label, options }) => (
          <div key={key}>
            <Label>{label}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSocialPrefs({ ...socialPrefs, [key]: opt })}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    socialPrefs[key] === opt
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200",
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button
        className="mt-10 w-full"
        disabled={Object.keys(socialPrefs).length < 3}
        onClick={handleFinish}
      >
        C&apos;est parti !
      </Button>
    </div>,
  ];

  return (
    <div className="min-h-screen">
      {step > 0 && step < 5 && (
        <div className="px-6 pt-6">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-stone-900" : "bg-stone-200",
                )}
              />
            ))}
          </div>
        </div>
      )}
      {steps[step]}
    </div>
  );
}
