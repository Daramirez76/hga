<?php

namespace Database\Factories;

use App\Models\residentes;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<residentes>
 */
class residentesFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = residentes::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $patologias = [
            'Alzheimer',
            'Parkinson',
            'Demencia',
            'Hipertensión',
            'Diabetes',
            'Artritis',
            'Osteoporosis',
            'Insuficiencia Cardíaca',
            'EPOC',
            'Depresión',
        ];
        
        $tipos_sangre = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
        
        return [
            'cod_residente' => $this->faker->unique()->numberBetween(1000, 99999),
            'nombre' => $this->faker->firstName(),
            'apellido' => $this->faker->lastName(),
            'edad' => $this->faker->numberBetween(60, 100),
            'patologia' => $this->faker->randomElement($patologias),
            'RH' => $this->faker->randomElement($tipos_sangre),
            'cod_usuario' => $this->faker->numberBetween(1000000, 99999999),
            'cod_rol' => 4, // Role for resident
        ];
    }

    /**
     * State for residents with high-risk pathologies.
     */
    public function highRisk(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'patologia' => $this->faker->randomElement(['Alzheimer', 'Parkinson', 'Insuficiencia Cardíaca']),
            ];
        });
    }

    /**
     * State for elderly residents (80+).
     */
    public function elderly(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'edad' => $this->faker->numberBetween(80, 100),
            ];
        });
    }
}
