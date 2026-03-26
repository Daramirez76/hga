<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('citas')) {
            return;
        }

        if (!Schema::hasColumn('citas', 'cod_usuario')) {
            Schema::table('citas', function (Blueprint $table) {
                $table->integer('cod_usuario')->nullable()->after('cod_Residente');
            });
        }

        $this->recreateNotificationTrigger();
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS tr_notificacion_cita');

        if (Schema::hasTable('citas') && Schema::hasColumn('citas', 'cod_usuario')) {
            Schema::table('citas', function (Blueprint $table) {
                $table->dropColumn('cod_usuario');
            });
        }
    }

    protected function recreateNotificationTrigger(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS tr_notificacion_cita');

        if (!Schema::hasTable('notificaciones')) {
            return;
        }

        DB::unprepared(<<<'SQL'
CREATE TRIGGER tr_notificacion_cita
AFTER INSERT ON citas
FOR EACH ROW
BEGIN
    DECLARE next_notification_code INT;

    IF NEW.cod_usuario IS NOT NULL AND NEW.cod_usuario > 0 THEN
        SELECT COALESCE(MAX(cod_Notificaciones), 0) + 1
        INTO next_notification_code
        FROM notificaciones;

        INSERT INTO notificaciones (
            cod_Notificaciones,
            cod_usuario,
            cod_Residente,
            Descrip_Novedad
        )
        VALUES (
            next_notification_code,
            NEW.cod_usuario,
            NEW.cod_Residente,
            CONCAT(
                'El residente con codigo ',
                NEW.cod_Residente,
                ' tiene una cita medica agendada para el ',
                DATE_FORMAT(NEW.Fecha_cita, '%d/%m/%Y'),
                ' a las ',
                TIME_FORMAT(NEW.hora_inicio, '%H:%i')
            )
        );
    END IF;
END
SQL);
    }
};
