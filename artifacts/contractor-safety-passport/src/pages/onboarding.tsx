import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Building2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useCreateOrganization, useGetOrganizationContext, getGetOrganizationContextQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUser, useClerk } from "@clerk/react";

const onboardingSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(120, "Company name is too long"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const { data: orgContext, isLoading: isCheckingOrg } = useGetOrganizationContext();

  useEffect(() => {
    if (orgContext) {
      setLocation("/dashboard");
    }
  }, [orgContext, setLocation]);

  const createOrg = useCreateOrganization({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrganizationContextQueryKey() });
        setLocation("/dashboard");
      }
    }
  });

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: OnboardingFormValues) => {
    createOrg.mutate({ data });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Header */}
      <header className="px-6 h-16 flex items-center border-b border-border/50 bg-card/30 backdrop-blur shrink-0 justify-between relative z-10">
        <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
          <ShieldCheck className="h-6 w-6" />
          <span>Safety Passport</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground hover:text-foreground">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-8 shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8 text-center">
            <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
              Create your workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Set up your contractor organization to start managing compliance and safety.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Company Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. PT. Mitra Konstruksi"
                        className="bg-input/50 border-input-border focus-visible:ring-primary h-11"
                        {...field}
                        disabled={createOrg.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                disabled={createOrg.isPending}
              >
                {createOrg.isPending ? (
                  "Creating workspace..."
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </main>

      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}