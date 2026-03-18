<?php

namespace Database\Factories;

use App\Models\usuarios;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<usuarios>
 */
class usuariosFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = usuarios::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tiposDoc = ['CC', 'CE', 'PP', 'TI'];
        $roles = [1, 2, 3, 4]; // 1: admin, 2: staff, 3: family, 4: resident
        $parentescos = ['Padre', 'Madre', 'Hijo', 'Hija', 'Hermano', 'Hermana', 'Esposo', 'Esposa', 'Otro'];
        
        return [
            'tipo_doc' => $this->faker->randomElement($tiposDoc),
            'doc_id' => $this->faker->unique()->numberBetween(1000000, 99999999),
            'nombre' => $this->faker->firstName(),
            'apellido' => $this->faker->lastName(),
            'edad' => $this->faker->numberBetween(18, 85),
            'direccion' => $this->faker->streetAddress(), // Single line address to avoid truncation issues
            'telefono' => $this->faker->numerify('##########'), // Generate numeric phone without formatting
            'email' => $this->faker->unique()->safeEmail(),
            'usuario' => $this->faker->unique()->userName(),
            'contraseña' => Hash::make('password123'), // Password hashed with bcrypt
            'cod_rol' => $this->faker->randomElement($roles),
            'parentesco' => $this->faker->randomElement($parentescos),
            'google_id' => null,
        ];
    }

    /**
     * State for admin users.
     */
    public function admin(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'cod_rol' => 1,
                'usuario' => 'admin_' . $this->faker->unique()->userName(),
            ];
        });
    }

    /**
     * State for staff users.
     */
    public function staff(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'cod_rol' => 2,
                'usuario' => 'staff_' . $this->faker->unique()->userName(),
            ];
        });
    }

    /**
     * State for family members.
     */
    public function family(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'cod_rol' => 3,
                'parentesco' => $this->faker->randomElement(['Padre', 'Madre', 'Hijo', 'Hija', 'Hermano', 'Hermana']),
            ];
        });
    }
}
