
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/actions";
import { useFormStatus } from "react-dom";
import { useState, useActionState } from "react";
import Image from "next/image";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
        </Button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useActionState(loginAction, null);
    const errorMessage = state?.error;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-col items-center space-y-2">
                    <CardTitle className="text-3xl font-light text-center text-primary">
                        Clinic Darc AI
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Insira sua credencial de acesso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Número de Telefone (ex: 55619...)
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Insira seu número de telefone..."
                            />
                        </div>
                        {errorMessage && (
                            <div className="text-sm text-red-500 font-medium">
                                {errorMessage}
                            </div>
                        )}
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
