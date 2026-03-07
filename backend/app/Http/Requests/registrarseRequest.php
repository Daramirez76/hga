<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class registrarseRequest extends FormRequest
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
            'name' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'tipo_doc' => 'required|string|max:16',
            'doc_id' => 'required|integer|unique:usuario,doc_id',
            'direccion' => 'required|string|max:150',
            'telefono' => 'required|integer',
            'edad' => 'required|integer|min:18|max:120',
            'email' => 'required|email|max:100|unique:usuario,email',
            'usuario' => 'required|string|max:100|unique:usuario,usuario',
            'password' => 'required|string|min:8|max:32|confirmed',
            'cod_rol' => 'nullable|integer',
            'parentesco' => 'nullable|string|max:32',
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es requerido',
            'name.string' => 'El nombre debe ser un texto',
            'name.max' => 'El nombre no puede exceder 100 caracteres',
            'apellido.required' => 'El apellido es requerido',
            'apellido.string' => 'El apellido debe ser un texto',
            'apellido.max' => 'El apellido no puede exceder 100 caracteres',
            'tipo_doc.required' => 'El tipo de documento es requerido',
            'tipo_doc.max' => 'El tipo de documento no puede exceder 16 caracteres',
            'doc_id.required' => 'El documento es requerido',
            'doc_id.integer' => 'El documento debe ser numérico',
            'doc_id.unique' => 'Este documento ya está registrado',
            'direccion.required' => 'La dirección es requerida',
            'direccion.max' => 'La dirección no puede exceder 150 caracteres',
            'telefono.required' => 'El teléfono es requerido',
            'telefono.integer' => 'El teléfono debe ser numérico',
            'edad.required' => 'La edad es requerida',
            'edad.integer' => 'La edad debe ser numérica',
            'edad.min' => 'La edad mínima es 18 años',
            'edad.max' => 'La edad no puede exceder 120 años',
            'email.required' => 'El email es requerido',
            'email.email' => 'El email debe ser válido',
            'email.unique' => 'Este email ya está registrado',
            'usuario.required' => 'El nombre de usuario es requerido',
            'usuario.unique' => 'Este nombre de usuario ya está registrado',
            'password.required' => 'La contraseña es requerida',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres',
            'password.max' => 'La contraseña no puede exceder 32 caracteres',
            'password.confirmed' => 'Las contraseñas no coinciden',
        ];
    }
}
