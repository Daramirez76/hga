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
            'cod_Informes' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
            'doc_id' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
            'cod_Residente' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
            'Titulo_Informes' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
            'cod_rol' => $isUpdate ? 'sometimes|required|integer' : 'required|integer'
        ];
    }

    public function messages(): array
    {
        return [
            'cod_Informes.required' => 'El código del informe es obligatorio.',
            'cod_Informes.integer' => 'El código del informe debe ser un número entero.',
            'doc_id.required' => 'El ID del documento es obligatorio.',
            'doc_id.integer' => 'El ID del documento debe ser un número entero.',
            'cod_Residente.required' => 'El código del residente es obligatorio.',
            'cod_Residente.integer' => 'El código del residente debe ser un número entero.',
            'Titulo_Informes.required' => 'El título del informe es obligatorio.',
            'Titulo_Informes.string' => 'El título del informe debe ser una cadena de texto.',
            'Titulo_Informes.max' => 'El título del informe no puede tener más de 50 caracteres.',
            'cod_rol.required' => 'El código del rol es obligatorio.',
            'cod_rol.integer' => 'El código del rol debe ser un número entero.'
        ];
    }
}

