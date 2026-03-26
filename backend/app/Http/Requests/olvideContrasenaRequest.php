<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class olvideContrasenaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        if ($this->routeIs('password.forgot.reset')) {
            return [
                'email' => 'required|email',
                'token' => 'required|string|max:255',
                'nueva_contraseña' => 'required|string|min:8|max:32',
                'confirmar_contraseña' => 'required|string|same:nueva_contraseña',
            ];
        }

        return [
            'email' => 'required|email',
            'return_to' => 'sometimes|nullable|in:login.html,login_employees.html',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'El email es requerido',
            'email.email' => 'El email debe ser válido',
            'token.required' => 'El enlace de recuperación no es válido o expiró',
            'token.string' => 'El enlace de recuperación no es válido o expiró',
            'token.max' => 'El enlace de recuperación no es válido o expiró',
            'nueva_contraseña.required' => 'La nueva contraseña es requerida',
            'nueva_contraseña.min' => 'La nueva contraseña debe tener al menos 8 caracteres',
            'nueva_contraseña.max' => 'La nueva contraseña no puede exceder 32 caracteres',
            'confirmar_contraseña.required' => 'La confirmación es requerida',
            'confirmar_contraseña.same' => 'Las contraseñas no coinciden',
            'return_to.in' => 'La ruta de retorno no es válida',
        ];
    }
}
