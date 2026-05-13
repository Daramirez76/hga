<?php

namespace Database\Factories;

use App\Models\actividades;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<actividades>
 */
class actividadesFactory extends Factory
{
    protected $model = actividades::class;

    public function definition(): array
    {
        static $nextCode = 1;

        $startHour = $this->faker->numberBetween(8, 16);
        $endHour = min($startHour + 1, 18);

        return [
            'Cod_acti_ludi' => $nextCode++,
            'Nombre' => $this->faker->sentence(3),
            'Fecha' => $this->faker->date(),
            'Hora_ini' => sprintf('%02d:00', $startHour),
            'Hora_fin' => sprintf('%02d:00', $endHour),
            'cod_residente' => $this->faker->numberBetween(1, 50),
            'cod_rol' => $this->faker->numberBetween(1, 6),
            'Lugar' => mb_substr($this->faker->city(), 0, 50),
        ];
    }
}
