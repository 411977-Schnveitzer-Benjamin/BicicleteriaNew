using System.Text.RegularExpressions;
using Bicicleteria.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bicicleteria.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PagosController : ControllerBase
{
    // 1. Obtener datos oficiales para Transferencia Bancaria (CBU / Alias)
    [HttpGet("datos-bancarios")]
    public ActionResult ObtenerDatosBancarios()
    {
        return Ok(new
        {
            Banco = "Banco Nación / Mercado Pago",
            Titular = "Bicicleterías El Cairo S.A.",
            Cuit = "30-71654982-9",
            Cbu = "0110599520000048291045",
            Alias = "EL.CAIRO.BICIS.MP",
            PorcentajeDescuento = 10
        });
    }

    // 2. Validar y autorizar pago con Tarjeta Visa o Mastercard
    [HttpPost("procesar-tarjeta")]
    public ActionResult<ProcesarTarjetaResponseDto> ProcesarTarjeta([FromBody] ProcesarTarjetaRequestDto dto)
    {
        var soloDigitos = Regex.Replace(dto.NumeroTarjeta ?? "", @"\D", "");

        if (soloDigitos.Length != 16)
            return BadRequest(new { mensaje = "El número de tarjeta debe contener exactamente 16 dígitos." });

        // Detectar Visa (empieza con 4) o Mastercard (empieza con 51-55 o 2221-2720)
        string? marca = null;
        if (soloDigitos.StartsWith('4'))
        {
            marca = "Visa";
        }
        else if (int.TryParse(soloDigitos[..2], out var prefijo2) && prefijo2 >= 51 && prefijo2 <= 55)
        {
            marca = "Mastercard";
        }
        else if (int.TryParse(soloDigitos[..4], out var prefijo4) && prefijo4 >= 2221 && prefijo4 <= 2720)
        {
            marca = "Mastercard";
        }

        if (marca == null)
            return BadRequest(new { mensaje = "Solo se aceptan tarjetas Visa (inician con 4) o Mastercard (inician con 51-55 o 2221-2720)." });

        if (string.IsNullOrWhiteSpace(dto.NombreTitular) || dto.NombreTitular.Trim().Length < 5)
            return BadRequest(new { mensaje = "Ingresá el nombre y apellido completo del titular de la tarjeta." });

        // Validar vencimiento MM/AA
        if (!Regex.IsMatch(dto.FechaVencimiento ?? "", @"^(0[1-9]|1[0-2])\/\d{2}$"))
            return BadRequest(new { mensaje = "La fecha de vencimiento debe tener formato MM/AA (ej. 08/28)." });

        var partesFecha = dto.FechaVencimiento!.Split('/');
        var mes = int.Parse(partesFecha[0]);
        var anio = 2000 + int.Parse(partesFecha[1]);
        var ultimoDiaMes = new DateTime(anio, mes, DateTime.DaysInMonth(anio, mes), 23, 59, 59);
        if (ultimoDiaMes < DateTime.UtcNow)
            return BadRequest(new { mensaje = "La tarjeta ingresada se encuentra vencida." });

        // Validar CVV (3 dígitos)
        if (!Regex.IsMatch(dto.CodigoSeguridad ?? "", @"^\d{3}$"))
            return BadRequest(new { mensaje = "El código de seguridad (CVV) debe tener 3 dígitos." });

        // Validar DNI del titular (7 u 8 dígitos)
        var dniLimpio = Regex.Replace(dto.DniTitular ?? "", @"\D", "");
        if (dniLimpio.Length < 7 || dniLimpio.Length > 8)
            return BadRequest(new { mensaje = "El DNI del titular debe tener entre 7 y 8 dígitos." });

        var cuotasValidas = new[] { 1, 3, 6 };
        var cuotas = cuotasValidas.Contains(dto.Cuotas) ? dto.Cuotas : 1;

        var ultimos4 = soloDigitos[^4..];
        var codAutorizacion = $"AUTH-{marca.ToUpper()[..4]}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        return Ok(new ProcesarTarjetaResponseDto(
            Aprobado: true,
            MarcaTarjeta: marca,
            UltimosCuatroDigitos: ultimos4,
            Cuotas: cuotas,
            MontoTotal: dto.Monto,
            ValorCuota: Math.Round(dto.Monto / cuotas, 2),
            CodigoAutorizacion: codAutorizacion,
            Mensaje: $"Pago con tarjeta {marca} terminada en {ultimos4} autorizado ({codAutorizacion})."));
    }

    // 3. Generar preferencia y QR dinámico de Mercado Pago (QR Interoperable / Dinero en Cuenta)
    [HttpPost("mercado-pago/preferencia")]
    public ActionResult<CrearPreferenciaMpResponseDto> CrearPreferenciaMercadoPago([FromBody] CrearPreferenciaMpRequestDto dto)
    {
        var prefId = $"MP-PREF-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        var qrPayload = $"00020101021243650016COM.MERCADOLIBRE020130636{prefId}520400005303032540{dto.MontoTotal:F0}5802AR5921BICICLETERIAS EL CAIRO6007CORDOBA6304ABCD";

        return Ok(new CrearPreferenciaMpResponseDto(
            PreferenciaId: prefId,
            Modalidad: dto.Modalidad,
            MontoTotal: dto.MontoTotal,
            QrDataPayload: qrPayload,
            AliasMercadoPago: "EL.CAIRO.BICIS.MP",
            Estado: "Verificado",
            ExpiraEn: DateTime.UtcNow.AddMinutes(15)));
    }
}

