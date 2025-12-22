import React from 'react';
import { User, Mail } from 'lucide-react';
import { RegistroField } from './RegistroField';
import { RegistroPasswordField } from './RegistroPasswordField';

interface RegistroFormInputsProps {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    showPassword: boolean;
    showConfirmPassword: boolean;
    loading: boolean;
    passwordStrength: { strength: number; label: string; color: string };
    onFullNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleShowPassword: () => void;
    onToggleShowConfirmPassword: () => void;
}

export const RegistroFormInputs: React.FC<RegistroFormInputsProps> = React.memo(({
    fullName,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    loading,
    passwordStrength,
    onFullNameChange,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onToggleShowPassword,
    onToggleShowConfirmPassword,
}) => {
    return (
        <div className="space-y-4">
            <RegistroField
                id="fullName"
                label="Nome Completo"
                value={fullName}
                onChange={onFullNameChange}
                placeholder="João da Silva"
                loading={loading}
                required
                icon={<User className="h-4 w-4" />}
            />

            <RegistroField
                id="email"
                label="Email"
                value={email}
                onChange={onEmailChange}
                type="email"
                placeholder="seu@email.com"
                loading={loading}
                required
                icon={<Mail className="h-4 w-4" />}
            />

            <RegistroPasswordField
                id="password"
                label="Senha"
                value={password}
                onChange={onPasswordChange}
                showPassword={showPassword}
                onToggleShowPassword={onToggleShowPassword}
                loading={loading}
                strength={passwordStrength}
            />

            <RegistroPasswordField
                id="confirmPassword"
                label="Confirmar Senha"
                value={confirmPassword}
                onChange={onConfirmPasswordChange}
                showPassword={showConfirmPassword}
                onToggleShowPassword={onToggleShowConfirmPassword}
                loading={loading}
                confirmMatch={password === confirmPassword}
            />
        </div>
    );
});

RegistroFormInputs.displayName = 'RegistroFormInputs';
