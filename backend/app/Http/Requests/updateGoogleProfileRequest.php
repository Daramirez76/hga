<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class updateGoogleProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $currentUserId = (int) ($this->user()?->id ?? 0);

        return [
            'tipo_doc' => 'required|string|max:16',
            'doc_id' => [
                'required',
                'integer',
                Rule::unique('usuario', 'doc_id')->ignore($currentUserId, 'doc_id'),
            ],
            'name' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'direccion' => 'required|string|max:150',
            'telefono' => 'required|string|max:20',
            'edad' => 'required|integer|min:18|max:120',
        ];
    }

    public function messages(): array
    {
        return [
            'tipo_doc.required' => 'El tipo de documento es obligatorio',
            'doc_id.required' => 'El número de documento es obligatorio',
            'doc_id.integer' => 'El número de documento debe ser numérico',
            'doc_id.unique' => 'Este número de documento ya está registrado',
            'name.required' => 'El nombre es obligatorio',
            'apellido.required' => 'El apellido es obligatorio',
            'direccion.required' => 'La dirección es obligatoria',
            'telefono.required' => 'El teléfono es obligatorio',
            'edad.required' => 'La edad es obligatoria',
            'edad.min' => 'La edad mínima es 18 años',
            'edad.max' => 'La edad no puede exceder 120 años',
        ];
    }
}
