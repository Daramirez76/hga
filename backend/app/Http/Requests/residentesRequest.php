<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class residentesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

public function rules(): array
{
    $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

    return [
       'cod_residente' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
       'nombre' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
       'apellido' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
       'edad' => $isUpdate ? 'sometimes|required|integer|min:0' : 'required|integer|min:0',
       'patologia' => $isUpdate ? 'sometimes|required|string|max:120' : 'required|string|max:120',
       'RH' => $isUpdate ? 'sometimes|required|string|max:6' : 'required|string|max:6',
       'cod_usuario' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
       'cod_rol' => $isUpdate ? 'sometimes|required|integer' : 'required|integer'
    ];
}

public function messages(): array
    {
       return [
        'cod_residente.required' => 'El código del residente es obligatorio.',
        'cod_residente.integer' => 'El código del residente debe ser un número entero.',
        'nombre.required' => 'El nombre es obligatorio.',
        'nombre.string' => 'El nombre debe ser una cadena de texto.',
        'nombre.max' => 'El nombre no puede tener más de 255 caracteres.',
        'apellido.required' => 'El apellido es obligatorio.',
        'apellido.string' => 'El apellido debe ser una cadena de texto.',
        'apellido.max' => 'El apellido no puede tener más de 50 caracteres.',
        'edad.required' => 'La edad es obligatoria.',
        'edad.integer' => 'La edad debe ser un número entero.',
        'edad.min' => 'La edad no puede ser negativa.',
        'patologia.required' => 'La patología es obligatoria.',
        'patologia.string' => 'La patología debe ser una cadena de texto.',
        'patologia.max' => 'La patología no puede tener más de 120 caracteres.',
        'RH.required' => 'El grupo sanguíneo RH es obligatorio.',
        'RH.string' => 'El grupo sanguíneo RH debe ser una cadena de texto.',
        'RH.max' => 'El grupo sanguíneo RH no puede tener más de 6 caracteres.',
        'cod_usuario.required' => 'El código del usuario es obligatorio.',
        'cod_usuario.integer' => 'El código del usuario debe ser un número entero.',
        'cod_rol.required' => 'El código del rol es obligatorio.',
        'cod_rol.integer' => 'El código del rol debe ser un número entero.'
    ];
    }
}
