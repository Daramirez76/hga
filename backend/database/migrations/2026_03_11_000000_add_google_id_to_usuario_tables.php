<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (['usuario', 'usuarios'] as $tableName) {
            if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'google_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->string('google_id')->nullable()->unique();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['usuario', 'usuarios'] as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'google_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->dropUnique($tableName . '_google_id_unique');
                $table->dropColumn('google_id');
            });
        }
    }
};
