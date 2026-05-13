<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class informesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'cod_Informes' => $isUpdate ? 'prohibited' : 'nullable|integer|min:1|unique:informes,cod_Informes',
            'cod_Residente' => $isUpdate
                ? 'sometimes|required|integer|exists:residente,cod_residente'
                : 'required|integer|exists:residente,cod_residente',
            'Titulo_Informes' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'tipo' => 'nullable|string|max:50',
            'urgencia' => 'nullable|in:baja,normal,alta',
        ];
    }

    public function messages(): array
    {
        return [
            'cod_Informes.integer' => 'El código del informe debe ser un número entero.',
            'cod_Informes.min' => 'El código del informe debe ser mayor que cero.',
            'cod_Informes.unique' => 'Ya existe un informe con ese código.',
            'cod_Informes.prohibited' => 'El código del informe no se puede modificar.',
            'cod_Residente.required' => 'Debes seleccionar un residente.',
            'cod_Residente.integer' => 'El código del residente debe ser un número entero.',
            'cod_Residente.exists' => 'El residente seleccionado no existe.',
            'Titulo_Informes.required' => 'El título del informe es obligatorio.',
            'Titulo_Informes.string' => 'El título del informe debe ser una cadena de texto.',
            'Titulo_Informes.max' => 'El título del informe no puede tener más de 255 caracteres.',
            'descripcion.string' => 'La descripción debe ser una cadena de texto.',
            'descripcion.max' => 'La descripción no puede tener más de 500 caracteres.',
            'tipo.string' => 'El tipo del informe debe ser una cadena de texto.',
            'tipo.max' => 'El tipo del informe no puede tener más de 50 caracteres.',
            'urgencia.in' => 'La urgencia seleccionada no es válida.',
        ];
    }
}
