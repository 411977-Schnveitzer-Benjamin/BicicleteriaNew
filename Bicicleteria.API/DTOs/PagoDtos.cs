namespace Bicicleteria.API.DTOs;

public record ProcesarTarjetaRequestDto(
    string NumeroTarjeta,
    string NombreTitular,
    string FechaVencimiento, // MM/AA
    string CodigoSeguridad,  // CVV 3 dígitos
    string DniTitular,
    int Cuotas,
    decimal Monto);

public record ProcesarTarjetaResponseDto(
    bool Aprobado,
    string MarcaTarjeta, // "Visa" o "Mastercard"
    string UltimosCuatroDigitos,
    int Cuotas,
    decimal MontoTotal,
    decimal ValorCuota,
    string CodigoAutorizacion,
    string Mensaje);

public record CrearPreferenciaMpRequestDto(
    decimal MontoTotal,
    string Modalidad); // "QR" o "DineroEnCuenta"

public record CrearPreferenciaMpResponseDto(
    string PreferenciaId,
    string Modalidad,
    decimal MontoTotal,
    string QrDataPayload,
    string AliasMercadoPago,
    string Estado,
    DateTime ExpiraEn);

