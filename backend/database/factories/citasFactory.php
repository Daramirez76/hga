<?php

namespace Database\Factories;

use App\Models\citas;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<citas>
 */
class citasFactory extends Factory
{
    protected $model = citas::class;

    public function definition(): array
    {
        static $nextCode = null;

        if ($nextCode === null) {
            $nextCode = ((int) citas::query()->max('cod_cita')) + 1;
        }

        $startHour = $this->faker->numberBetween(8, 16);
        $endHour = min($startHour + 1, 18);

        return [
            'cod_cita' => $nextCode++,
            'Fecha_cita' => $this->faker->date(),
            'hora_inicio' => sprintf('%02d:00', $startHour),
            'hora_fin' => sprintf('%02d:00', $endHour),
            'Nombre_acompañante' => mb_substr($this->faker->name(), 0, 50),
            'Lugar_cita' => mb_substr($this->faker->city(), 0, 30),
            'cod_Residente' => $this->faker->numberBetween(1, 50),
        ];
    }
}
