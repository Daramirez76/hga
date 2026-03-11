<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class citasRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
         $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'cod_cita' => $isUpdate ?  'sometimes|required|integer' : 'required|integer',
            'Fecha_cita' => $isUpdate ? 'sometimes|required|date' : 'required|date',
            'hora_inicio' => $isUpdate ? 'sometimes|required|date_format:H:i' : 'required|date_format:H:i',
            'hora_fin' => $isUpdate ? 'sometimes|required|date_format:H:i|after:hora_inicio' : 'required|date_format:H:i|after:hora_inicio',
            'Nombre_acompañante' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
            'Lugar_cita' => $isUpdate ? 'sometimes|required|string|max:100' : 'required|string|max:100',
            'cod_Residente' => $isUpdate ? 'sometimes|required|integer' : 'required|integer'
        ];
    }

    public function messages(): array
    {
        return [
            'cod_cita.required' => 'El código de la cita es obligatorio.',
            'cod_cita.integer' => 'El código de la cita debe ser un número entero.',
            'Fecha_cita.required' => 'La fecha de la cita es obligatoria.',
            'Fecha_cita.date' => 'La fecha de la cita debe ser una fecha válida.',
            'hora_inicio.required' => 'La hora de inicio es obligatoria.',
            'hora_inicio.date_format' => 'La hora de inicio debe tener el formato HH:mm.',
            'hora_fin.required' => 'La hora de fin es obligatoria.',
            'hora_fin.date_format' => 'La hora de fin debe tener el formato HH:mm.',
            'hora_fin.after' => 'La hora de fin debe ser posterior a la hora de inicio.',
            'Nombre_acompañante.required' => 'El nombre del acompañante es obligatorio.',
            'Nombre_acompañante.string' => 'El nombre del acompañante debe ser una cadena de texto.',
            'Nombre_acompañante.max' => 'El nombre del acompañante no puede tener más de 50 caracteres.',
            'Lugar_cita.required' => 'El lugar de la cita es obligatorio.',
            'Lugar_cita.string' => 'El lugar de la cita debe ser una cadena de texto.',
            'Lugar_cita.max' => 'El lugar de la cita no puede tener más de 100 caracteres.',
            'cod_Residente.required' => 'El código del residente es obligatorio.',
            'cod_Residente.integer' => 'El código del residente debe ser un número entero.'
        ];
    }
}
