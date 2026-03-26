<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class iniciarSesionRequest extends FormRequest
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
        return [
            'email' => 'required_without:usuario|string|max:100',
            'usuario' => 'required_without:email|string|max:100',
            'password' => 'required|string|max:255',
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'email.required_without' => 'Debes ingresar correo o nombre de usuario',
            'email.string' => 'El correo o usuario debe ser texto válido',
            'email.max' => 'El correo o usuario no puede exceder 100 caracteres',
            'usuario.required_without' => 'Debes ingresar correo o nombre de usuario',
            'usuario.string' => 'El correo o usuario debe ser texto válido',
            'usuario.max' => 'El correo o usuario no puede exceder 100 caracteres',
            'password.required' => 'La contraseña es requerida',
            'password.max' => 'La contraseña no puede exceder 255 caracteres',
        ];
    }
}
