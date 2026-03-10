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
             "cod_Visitas" => $isUpdate ? "sometimes|required|integer" : "required|integer",
             "doc_id" => $isUpdate ? "sometimes|required|integer" : "required|integer",
             "Nomb_visitante" => $isUpdate ? "sometimes|required|string|max:50" : "required|string|max:50",
             "cod_Residente" => $isUpdate ? "sometimes|required|integer" : "required|integer",
             "Fecha_Visita" => $isUpdate ? "sometimes|required|date" : "required|date",
             "cod_usuario" => $isUpdate ? "sometimes|required|integer" : "required|integer",
        ];
    }

    public function messages(): array
    {
        return [
            "cod_Visitas.required" => "El código de la visita es obligatorio.",
            "cod_Visitas.integer" => "El código de la visita debe ser un número entero.",
            "doc_id.required" => "El documento de identidad del visitante es obligatorio.",
            "doc_id.integer" => "El documento de identidad del visitante debe ser un número entero.",
            "Nomb_visitante.required" => "El nombre del visitante es obligatorio.",
            "Nomb_visitante.string" => "El nombre del visitante debe ser una cadena de texto.",
            "Nomb_visitante.max" => "El nombre del visitante no puede tener más de 50 caracteres.",
            "cod_Residente.required" => "El código del residente es obligatorio.",
            "cod_Residente.integer" => "El código del residente debe ser un número entero.",
            "Fecha_Visita.required" => "La fecha de la visita es obligatoria.",
            "Fecha_Visita.date" => "La fecha de la visita debe ser una fecha válida.",
            "cod_usuario.required" => "El código del usuario es obligatorio.",
            "cod_usuario.integer" => "El código del usuario debe ser un número entero."
        ];
    }
}
