<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class actividadesRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'Cod_acti_ludi' => 'sometimes|nullable|integer|min:1|max:2147483647',
            'Nombre' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
            'Fecha' => $isUpdate ? 'sometimes|required|date' : 'required|date',
            'Hora_ini' => $isUpdate ? 'sometimes|required|date_format:H:i' : 'required|date_format:H:i',
            'Hora_fin' => $isUpdate ? 'sometimes|required|date_format:H:i' : 'required|date_format:H:i',
            'cod_residente' => $isUpdate ? 'sometimes|required|integer|min:1' : 'required|integer|min:1',
            'cod_rol' => 'sometimes|nullable|integer|min:1',
            'Lugar' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'Cod_acti_ludi.integer' => 'El código de la actividad debe ser un número entero.',
            'Cod_acti_ludi.min' => 'El código de la actividad debe ser mayor que cero.',
            'Cod_acti_ludi.max' => 'El código de la actividad supera el límite admitido.',
            'Nombre.required' => 'El nombre de la actividad es obligatorio.',
            'Nombre.string' => 'El nombre de la actividad debe ser una cadena de texto.',
            'Nombre.max' => 'El nombre de la actividad no puede tener más de 50 caracteres.',
            'Fecha.required' => 'La fecha de la actividad es obligatoria.',
            'Fecha.date' => 'La fecha de la actividad debe ser una fecha válida.',
            'Hora_ini.required' => 'La hora de inicio es obligatoria.',
            'Hora_ini.date_format' => 'La hora de inicio debe tener el formato HH:mm.',
            'Hora_fin.required' => 'La hora de fin es obligatoria.',
            'Hora_fin.date_format' => 'La hora de fin debe tener el formato HH:mm.',
            'cod_residente.required' => 'El código del residente es obligatorio.',
            'cod_residente.integer' => 'El código del residente debe ser un número entero.',
            'cod_residente.min' => 'El código del residente debe ser mayor que cero.',
            'cod_rol.integer' => 'El código del rol debe ser un número entero.',
            'cod_rol.min' => 'El código del rol debe ser mayor que cero.',
            'Lugar.required' => 'El lugar de la actividad es obligatorio.',
            'Lugar.string' => 'El lugar de la actividad debe ser una cadena de texto.',
            'Lugar.max' => 'El lugar de la actividad no puede tener más de 50 caracteres.'
        ];
    }
}
