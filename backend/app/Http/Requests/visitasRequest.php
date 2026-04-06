<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class visitasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'cod_Visitas' => $isUpdate ? 'sometimes|integer|min:1' : 'sometimes|integer|min:1|unique:visita,cod_Visitas',
            'doc_id' => 'required|integer|min:1',
            'Nomb_visitante' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
            'cod_Residente' => $isUpdate ? 'sometimes|required|integer|min:1|exists:residente,cod_residente' : 'required|integer|min:1|exists:residente,cod_residente',
            'Fecha_Visita' => $isUpdate ? 'sometimes|required|date' : 'required|date',
            'hora_inicio' => $isUpdate ? 'sometimes|required|date_format:H:i' : 'required|date_format:H:i',
            'hora_fin' => $isUpdate ? 'sometimes|required|date_format:H:i|after:hora_inicio' : 'required|date_format:H:i|after:hora_inicio',
            'cod_usuario' => 'sometimes|integer|min:1|exists:usuario,doc_id',
        ];
    }

    public function messages(): array
    {
        return [
            'cod_Visitas.integer' => 'El código de la visita debe ser un número entero.',
            'cod_Visitas.min' => 'El código de la visita debe ser mayor que cero.',
            'cod_Visitas.unique' => 'Ya existe una visita con ese código.',
            'doc_id.required' => 'El documento de identidad del visitante es obligatorio.',
            'doc_id.integer' => 'El documento de identidad del visitante debe ser un número entero.',
            'doc_id.min' => 'El documento de identidad del visitante debe ser mayor que cero.',
            'Nomb_visitante.required' => 'El nombre del visitante es obligatorio.',
            'Nomb_visitante.string' => 'El nombre del visitante debe ser una cadena de texto.',
            'Nomb_visitante.max' => 'El nombre del visitante no puede tener más de 50 caracteres.',
            'cod_Residente.required' => 'El código del residente es obligatorio.',
            'cod_Residente.integer' => 'El código del residente debe ser un número entero.',
            'cod_Residente.min' => 'El código del residente debe ser mayor que cero.',
            'cod_Residente.exists' => 'El residente seleccionado no existe.',
            'Fecha_Visita.required' => 'La fecha de la visita es obligatoria.',
            'Fecha_Visita.date' => 'La fecha de la visita debe ser una fecha válida.',
            'hora_inicio.required' => 'La hora de inicio de la visita es obligatoria.',
            'hora_inicio.date_format' => 'La hora de inicio debe tener el formato HH:MM.',
            'hora_fin.required' => 'La hora de fin de la visita es obligatoria.',
            'hora_fin.date_format' => 'La hora de fin debe tener el formato HH:MM.',
            'hora_fin.after' => 'La hora de fin debe ser posterior a la hora de inicio.',
            'cod_usuario.integer' => 'El código del usuario debe ser un número entero.',
            'cod_usuario.min' => 'El código del usuario debe ser mayor que cero.',
            'cod_usuario.exists' => 'El usuario seleccionado no existe.',
        ];
    }
}
