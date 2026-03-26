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

        $this->dropLegacyNotificationTrigger();
    }

    public function down(): void
    {
        $this->dropLegacyNotificationTrigger();

        if (Schema::hasTable('citas') && Schema::hasColumn('citas', 'cod_usuario')) {
            Schema::table('citas', function (Blueprint $table) {
                $table->dropColumn('cod_usuario');
            });
        }
    }

    protected function dropLegacyNotificationTrigger(): void
    {
        // Notifications are handled by the application service layer and stored
        // in notificaciones_sistema, so we only need to remove the legacy trigger.
        DB::unprepared('DROP TRIGGER IF EXISTS tr_notificacion_cita');
    }
};
