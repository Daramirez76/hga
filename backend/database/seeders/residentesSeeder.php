<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class residentesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create regular residents
        \App\Models\residentes::factory(5)->create();

        // Create high-risk residents
        \App\Models\residentes::factory(3)->highRisk()->create();

        // Create elderly residents (80+)
        \App\Models\residentes::factory(2)->elderly()->create();
    }
}
