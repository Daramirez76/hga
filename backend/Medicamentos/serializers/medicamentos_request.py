from rest_framework import serializers


class MedicamentoRequestSerializer(serializers.Serializer):
    """Valida los datos de entrada para crear/actualizar un medicamento."""

    cod_medicamento = serializers.IntegerField(required=False)
    nombre_medic = serializers.CharField(max_length=100)
    fecha_entrada = serializers.DateField()
    fecha_vencimiento = serializers.DateField()
    cod_usuario = serializers.IntegerField()
    cod_residente = serializers.IntegerField()
    cod_rol = serializers.IntegerField()
    descrip_novedad = serializers.CharField(max_length=100)
    fecha_novedad = serializers.DateField()
    stock = serializers.IntegerField()

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock debe ser mayor o igual a 0")
        return value

    def validate(self, attrs):
        """Validaciones cruzadas de fechas."""
        entrada = attrs.get("fecha_entrada")
        vencimiento = attrs.get("fecha_vencimiento")
        if entrada and vencimiento and vencimiento < entrada:
            raise serializers.ValidationError("La fecha de vencimiento no puede ser anterior a la entrada")
        return attrs
