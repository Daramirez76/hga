<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VisitWithinBusinessHours implements ValidationRule
{
    /**
     * Validar que la fecha de visita sea lunes-viernes y la hora esté entre 09:00 y 16:00
     * 
     * @param  string  $attribute
     * @param  mixed  $value
     * @param  Closure  $fail
     * @return void
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Se valida en el RequestFormRequest mismo con lógica personalizada
        // Este archivo es una referencia para el futuro si se necesita
    }
}
