<?php

namespace App\Http\Requests;

use App\Models\citas;
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
            'cod_cita' => $isUpdate ? 'sometimes|integer|min:1' : 'nullable|integer|min:1|unique:citas,cod_cita',
            'Fecha_cita' => $isUpdate ? 'sometimes|required|date' : 'required|date',
            'hora_inicio' => $isUpdate ? 'sometimes|required|date_format:H:i' : 'required|date_format:H:i',
            'hora_fin' => $isUpdate ? 'sometimes|required|date_format:H:i' : 'required|date_format:H:i',
            'Nombre_acompañante' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
            'Lugar_cita' => $isUpdate ? 'sometimes|required|string|max:30' : 'required|string|max:30',
            'cod_Residente' => $isUpdate ? 'sometimes|required|integer|exists:residente,cod_residente' : 'required|integer|exists:residente,cod_residente',
            'cod_usuario' => 'sometimes|integer|min:1|exists:usuario,doc_id',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $horaInicio = $this->input('hora_inicio');
            $horaFin = $this->input('hora_fin');
            $citaId = $this->route('cita');

            if (($horaInicio === null || $horaFin === null) && $citaId) {
                $cita = citas::find((int) $citaId);

                if ($cita) {
                    $horaInicio = $horaInicio ?? $cita->hora_inicio;
                    $horaFin = $horaFin ?? $cita->hora_fin;
                }
            }

            if ($horaInicio !== null && $horaFin !== null && strtotime((string) $horaFin) <= strtotime((string) $horaInicio)) {
                $validator->errors()->add('hora_fin', 'La hora de fin debe ser posterior a la hora de inicio.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'cod_cita.integer' => 'El código de la cita debe ser un número entero.',
            'cod_cita.min' => 'El código de la cita debe ser mayor que cero.',
            'cod_cita.unique' => 'Ya existe una cita con ese código.',
            'Fecha_cita.required' => 'La fecha de la cita es obligatoria.',
            'Fecha_cita.date' => 'La fecha de la cita debe ser una fecha válida.',
            'hora_inicio.required' => 'La hora de inicio es obligatoria.',
            'hora_inicio.date_format' => 'La hora de inicio debe tener el formato HH:mm.',
            'hora_fin.required' => 'La hora de fin es obligatoria.',
            'hora_fin.date_format' => 'La hora de fin debe tener el formato HH:mm.',
            'Nombre_acompañante.required' => 'El nombre del acompañante es obligatorio.',
            'Nombre_acompañante.string' => 'El nombre del acompañante debe ser una cadena de texto.',
            'Nombre_acompañante.max' => 'El nombre del acompañante no puede tener más de 50 caracteres.',
            'Lugar_cita.required' => 'El lugar de la cita es obligatorio.',
            'Lugar_cita.string' => 'El lugar de la cita debe ser una cadena de texto.',
            'Lugar_cita.max' => 'El lugar de la cita no puede tener más de 30 caracteres.',
            'cod_Residente.required' => 'El código del residente es obligatorio.',
            'cod_Residente.integer' => 'El código del residente debe ser un número entero.',
            'cod_Residente.exists' => 'El residente seleccionado no existe.',
            'cod_usuario.integer' => 'El código del usuario debe ser un número entero.',
            'cod_usuario.min' => 'El código del usuario debe ser mayor que cero.',
            'cod_usuario.exists' => 'El usuario seleccionado no existe.',
        ];
    }
}
