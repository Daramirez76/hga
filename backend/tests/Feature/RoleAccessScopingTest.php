<?php

namespace Tests\Feature;

use App\Models\citas;
use App\Models\informes;
use App\Models\actividades;
use App\Models\residentes;
use App\Models\usuarios;
use App\Models\visitas;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RoleAccessScopingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('jwt.secret', str_repeat('a', 32));

        Schema::dropIfExists('informes');
        Schema::dropIfExists('visita');
        Schema::dropIfExists('citas');
        Schema::dropIfExists('actividades_ludicas');
        Schema::dropIfExists('residente');
        Schema::dropIfExists('usuario');

        Schema::create('usuario', function (Blueprint $table) {
            $table->integer('doc_id')->primary();
            $table->string('tipo_doc', 16)->nullable();
            $table->string('nombre', 100)->nullable();
            $table->string('apellido', 100)->nullable();
            $table->integer('edad')->nullable();
            $table->string('direccion', 150)->nullable();
            $table->bigInteger('telefono')->nullable();
            $table->string('email', 100)->nullable();
            $table->string('usuario', 100)->nullable();
            $table->string('contraseña', 255)->nullable();
            $table->integer('cod_rol')->default(4);
            $table->string('parentesco', 32)->nullable();
            $table->string('google_id')->nullable();
        });

        Schema::create('residente', function (Blueprint $table) {
            $table->integer('cod_residente')->primary();
            $table->string('nombre', 50);
            $table->string('apellido', 50);
            $table->integer('edad');
            $table->string('patologia', 120);
            $table->string('RH', 6);
            $table->integer('cod_usuario');
            $table->integer('cod_rol')->default(4);
        });

        Schema::create('citas', function (Blueprint $table) {
            $table->integer('cod_cita')->primary();
            $table->date('Fecha_cita');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('Nombre_acompañante', 50);
            $table->string('Lugar_cita', 50);
            $table->integer('cod_Residente');
            $table->integer('cod_usuario')->nullable();
        });

        Schema::create('actividades_ludicas', function (Blueprint $table) {
            $table->integer('Cod_acti_ludi')->primary();
            $table->string('Nombre', 50);
            $table->date('Fecha');
            $table->time('Hora_ini');
            $table->time('Hora_fin');
            $table->integer('cod_residente');
            $table->integer('cod_rol')->default(2);
            $table->string('Lugar', 50);
        });

        Schema::create('visita', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('cod_Visitas')->nullable();
            $table->integer('doc_id')->nullable();
            $table->string('Nomb_visitante', 100);
            $table->integer('cod_Residente');
            $table->date('Fecha_Visita');
            $table->integer('cod_usuario')->nullable();
            $table->timestamps();
        });

        Schema::create('informes', function (Blueprint $table) {
            $table->integer('cod_Informes')->primary();
            $table->integer('doc_id');
            $table->integer('cod_Residente');
            $table->string('Titulo_Informes', 150);
            $table->integer('cod_rol')->default(2);
            $table->text('descripcion')->nullable();
            $table->string('tipo', 50)->nullable();
            $table->string('urgencia', 50)->nullable();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('informes');
        Schema::dropIfExists('visita');
        Schema::dropIfExists('citas');
        Schema::dropIfExists('actividades_ludicas');
        Schema::dropIfExists('residente');
        Schema::dropIfExists('usuario');

        parent::tearDown();
    }

    public function test_tutor_only_receives_associated_resident_records(): void
    {
        $tutor = $this->createUser(4001, 4, 'tutor1@example.com');
        $this->createUser(4002, 4, 'tutor2@example.com');

        residentes::query()->create([
            'cod_residente' => 1,
            'nombre' => 'Ana',
            'apellido' => 'Tutor',
            'edad' => 82,
            'patologia' => 'Hipertension',
            'RH' => 'O+',
            'cod_usuario' => 4001,
            'cod_rol' => 4,
        ]);

        residentes::query()->create([
            'cod_residente' => 2,
            'nombre' => 'Luis',
            'apellido' => 'Ajeno',
            'edad' => 84,
            'patologia' => 'Diabetes',
            'RH' => 'A+',
            'cod_usuario' => 4002,
            'cod_rol' => 4,
        ]);

        $this->actingAs($tutor, 'api');

        $this->getJson('/api/residentes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.cod_residente', 1);

        $this->getJson('/api/residentes/2')->assertNotFound();
    }

    public function test_tutor_only_receives_associated_citas_and_visitas(): void
    {
        $tutor = $this->createUser(4001, 4, 'tutor1@example.com');
        $this->createUser(4002, 4, 'tutor2@example.com');

        residentes::query()->create([
            'cod_residente' => 1,
            'nombre' => 'Ana',
            'apellido' => 'Tutor',
            'edad' => 82,
            'patologia' => 'Hipertension',
            'RH' => 'O+',
            'cod_usuario' => 4001,
            'cod_rol' => 4,
        ]);

        residentes::query()->create([
            'cod_residente' => 2,
            'nombre' => 'Luis',
            'apellido' => 'Ajeno',
            'edad' => 84,
            'patologia' => 'Diabetes',
            'RH' => 'A+',
            'cod_usuario' => 4002,
            'cod_rol' => 4,
        ]);

        citas::query()->create([
            'cod_cita' => 1,
            'Fecha_cita' => '2026-03-26',
            'hora_inicio' => '08:00:00',
            'hora_fin' => '09:00:00',
            'Nombre_acompañante' => 'Tutor Uno',
            'Lugar_cita' => 'Clinica A',
            'cod_Residente' => 1,
            'cod_usuario' => 4001,
        ]);

        citas::query()->create([
            'cod_cita' => 2,
            'Fecha_cita' => '2026-03-27',
            'hora_inicio' => '10:00:00',
            'hora_fin' => '11:00:00',
            'Nombre_acompañante' => 'Tutor Dos',
            'Lugar_cita' => 'Clinica B',
            'cod_Residente' => 2,
            'cod_usuario' => 4002,
        ]);

        visitas::query()->create([
            'cod_Visitas' => 1,
            'doc_id' => 5001,
            'Nomb_visitante' => 'Visitante Uno',
            'cod_Residente' => 1,
            'Fecha_Visita' => '2026-03-26',
            'cod_usuario' => 4001,
        ]);

        visitas::query()->create([
            'cod_Visitas' => 2,
            'doc_id' => 5002,
            'Nomb_visitante' => 'Visitante Dos',
            'cod_Residente' => 2,
            'Fecha_Visita' => '2026-03-27',
            'cod_usuario' => 4002,
        ]);

        $this->actingAs($tutor, 'api');

        $this->getJson('/api/citas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.cod_cita', 1);

        $this->getJson('/api/citas/2')->assertNotFound();

        $this->getJson('/api/visitas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.cod_Residente', 1);

        $this->getJson('/api/visitas/2')->assertNotFound();
    }

    public function test_dashboard_is_forbidden_for_enfermero_and_citas_write_is_forbidden_for_tutor(): void
    {
        $nurse = $this->createUser(2001, 2, 'nurse@example.com');
        $tutor = $this->createUser(4001, 4, 'tutor@example.com');

        $this->actingAs($nurse, 'api');
        $this->getJson('/api/dashboard')->assertForbidden();

        $this->actingAs($tutor, 'api');
        $this->postJson('/api/citas', [])->assertForbidden();
    }

    public function test_tutor_chatbot_context_includes_scoped_knowledge_and_role_based_views(): void
    {
        $tutor = $this->createUser(4001, 4, 'tutor1@example.com');
        $this->createUser(4002, 4, 'tutor2@example.com');

        residentes::query()->create([
            'cod_residente' => 1,
            'nombre' => 'Ana',
            'apellido' => 'Tutor',
            'edad' => 82,
            'patologia' => 'Hipertension',
            'RH' => 'O+',
            'cod_usuario' => 4001,
            'cod_rol' => 4,
        ]);

        residentes::query()->create([
            'cod_residente' => 2,
            'nombre' => 'Luis',
            'apellido' => 'Ajeno',
            'edad' => 84,
            'patologia' => 'Diabetes',
            'RH' => 'A+',
            'cod_usuario' => 4002,
            'cod_rol' => 4,
        ]);

        actividades::query()->create([
            'Cod_acti_ludi' => 1,
            'Nombre' => 'Lectura guiada',
            'Fecha' => now()->addDay()->format('Y-m-d'),
            'Hora_ini' => '09:00:00',
            'Hora_fin' => '10:00:00',
            'cod_residente' => 1,
            'cod_rol' => 2,
            'Lugar' => 'Salon principal',
        ]);

        actividades::query()->create([
            'Cod_acti_ludi' => 2,
            'Nombre' => 'Actividad ajena',
            'Fecha' => now()->addDays(2)->format('Y-m-d'),
            'Hora_ini' => '11:00:00',
            'Hora_fin' => '12:00:00',
            'cod_residente' => 2,
            'cod_rol' => 2,
            'Lugar' => 'Salon 2',
        ]);

        visitas::query()->create([
            'cod_Visitas' => 1,
            'doc_id' => 5001,
            'Nomb_visitante' => 'Laura',
            'cod_Residente' => 1,
            'Fecha_Visita' => now()->addDay()->format('Y-m-d'),
            'cod_usuario' => 4001,
        ]);

        visitas::query()->create([
            'cod_Visitas' => 2,
            'doc_id' => 5002,
            'Nomb_visitante' => 'Carlos',
            'cod_Residente' => 2,
            'Fecha_Visita' => now()->addDays(2)->format('Y-m-d'),
            'cod_usuario' => 4002,
        ]);

        $this->actingAs($tutor, 'api');

        $this->getJson('/api/chatbot/context')
            ->assertOk()
            ->assertJsonPath('data.view_routes.actividades.href', 'recreational_activities.html')
            ->assertJsonPath('data.view_routes.visitas.href', 'home.html')
            ->assertJsonPath('data.knowledge.activities.items.0.title', 'Lectura guiada')
            ->assertJsonPath('data.knowledge.visits.items.0.visitor', 'Laura')
            ->assertJsonCount(1, 'data.knowledge.activities.items')
            ->assertJsonCount(1, 'data.knowledge.visits.items');
    }

    public function test_enfermero_can_view_all_informes(): void
    {
        $nurse = $this->createUser(2001, 2, 'nurse@example.com');

        informes::query()->create([
            'cod_Informes' => 1,
            'doc_id' => 9001,
            'cod_Residente' => 1,
            'Titulo_Informes' => 'Informe 1',
            'cod_rol' => 2,
            'descripcion' => 'Detalle 1',
            'tipo' => 'general',
            'urgencia' => 'normal',
        ]);

        informes::query()->create([
            'cod_Informes' => 2,
            'doc_id' => 9002,
            'cod_Residente' => 2,
            'Titulo_Informes' => 'Informe 2',
            'cod_rol' => 2,
            'descripcion' => 'Detalle 2',
            'tipo' => 'general',
            'urgencia' => 'normal',
        ]);

        $this->actingAs($nurse, 'api');

        $this->getJson('/api/informes')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_public_register_forces_tutor_role_even_if_payload_tries_admin(): void
    {
        $payload = $this->buildRegistrationPayload('public-role@example.com');
        $payload['cod_rol'] = 1;

        $this->postJson('/api/register', $payload, [
            'X-Register-Source' => 'public',
        ])->assertCreated();

        $this->assertSame(
            4,
            (int) usuarios::query()->where('email', 'public-role@example.com')->value('cod_rol')
        );
    }

    public function test_employee_register_forces_nurse_role_even_if_payload_tries_admin(): void
    {
        $payload = $this->buildRegistrationPayload('employee-role@example.com');
        $payload['cod_rol'] = 1;

        $this->postJson('/api/register', $payload, [
            'X-Register-Source' => 'employee',
        ])->assertCreated();

        $this->assertSame(
            2,
            (int) usuarios::query()->where('email', 'employee-role@example.com')->value('cod_rol')
        );
    }

    public function test_tutor_can_view_general_activities(): void
    {
        $tutor = $this->createUser(4001, 4, 'tutor-activities@example.com');

        actividades::query()->create([
            'Cod_acti_ludi' => 1,
            'Nombre' => 'Taller de memoria',
            'Fecha' => '2026-03-26',
            'Hora_ini' => '09:00:00',
            'Hora_fin' => '10:00:00',
            'cod_residente' => 1,
            'cod_rol' => 2,
            'Lugar' => 'Salon principal',
        ]);

        actividades::query()->create([
            'Cod_acti_ludi' => 2,
            'Nombre' => 'Tarde musical',
            'Fecha' => '2026-03-27',
            'Hora_ini' => '15:00:00',
            'Hora_fin' => '16:00:00',
            'cod_residente' => 2,
            'cod_rol' => 2,
            'Lugar' => 'Patio central',
        ]);

        $this->actingAs($tutor, 'api');

        $this->getJson('/api/actividades')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    private function createUser(int $docId, int $roleCode, string $email): usuarios
    {
        return usuarios::query()->create([
            'tipo_doc' => 'CC',
            'doc_id' => $docId,
            'nombre' => 'Usuario',
            'apellido' => 'Prueba',
            'edad' => 30,
            'direccion' => 'Calle 1',
            'telefono' => 3001234567,
            'email' => $email,
            'usuario' => 'user' . $docId,
            'contraseña' => 'secret',
            'cod_rol' => $roleCode,
            'parentesco' => 'Familiar',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildRegistrationPayload(string $email): array
    {
        $docId = random_int(50000, 90000);

        return [
            'name' => 'Registro',
            'apellido' => 'Prueba',
            'tipo_doc' => 'CC',
            'doc_id' => $docId,
            'direccion' => 'Calle 123',
            'telefono' => 3001234567,
            'edad' => 30,
            'email' => $email,
            'usuario' => 'user' . $docId,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'parentesco' => 'Familiar',
        ];
    }
}
