<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class medicamentosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

public function rules(): array
{
    $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

    return [
        'cod_medicamento' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
        'nombre_medic' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
        'fecha_entrada' => $isUpdate ? 'sometimes|required|date' : 'required|date',
        'fecha_vencimiento' => $isUpdate ? 'sometimes|required|date|after_or_equal:fecha_entrada' : 'required|date|after_or_equal:fecha_entrada',
        'cod_usuario' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
        'cod_residente' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
        'descrip_novedad' => $isUpdate ? 'sometimes|required|string|max:500' : 'required|string|max:500',
        'fecha_novedad' => $isUpdate ? 'sometimes|required|date' : 'required|date',
        'stock' => $isUpdate ? 'sometimes|required|integer|min:0' : 'required|integer|min:0'
    ];
}

public function messages(): array
    {
        return [
            'cod_medicamento.required' => 'El código del medicamento es obligatorio.',
            'cod_medicamento.integer' => 'El código del medicamento debe ser un número entero.',
            'nombre_medic.required' => 'El nombre del medicamento es obligatorio.',
            'nombre_medic.string' => 'El nombre del medicamento debe ser una cadena de texto.',
            'nombre_medic.max' => 'El nombre del medicamento no puede tener más de 255 caracteres.',
            'fecha_entrada.required' => 'La fecha de entrada es obligatoria.',
            'fecha_entrada.date' => 'La fecha de entrada debe ser una fecha válida.',
            'fecha_vencimiento.required' => 'La fecha de vencimiento es obligatoria.',
            'fecha_vencimiento.date' => 'La fecha de vencimiento debe ser una fecha válida.',
            'fecha_vencimiento.after_or_equal' => 'La fecha de vencimiento debe ser igual o posterior a la fecha de entrada.',
            'cod_usuario.required' => 'El código del usuario es obligatorio.',
            'cod_usuario.integer' => 'El código del usuario debe ser un número entero.',
            'cod_residente.required' => 'El código del residente es obligatorio.',
            'cod_residente.integer' => 'El código del residente debe ser un número entero.',
            'descrip_novedad.required' => 'La descripción de la novedad es obligatoria.',
            'descrip_novedad.string' => 'La descripción de la novedad debe ser una cadena de texto.',
            'descrip_novedad.max' => 'La descripción de la novedad no puede tener más de 500 caracteres.',
            'fecha_novedad.required' => 'La fecha de la novedad es obligatoria.',
            'fecha_novedad.date' => 'La fecha de la novedad debe ser una fecha válida.',
            'stock.required' => 'El stock es obligatorio.',
            'stock.integer' => 'El stock debe ser un número entero.',
            'stock.min' => 'El stock no puede ser negativo.'
        ];
    }
}