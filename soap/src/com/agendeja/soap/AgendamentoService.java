package com.agendeja.soap;

import javax.jws.WebMethod;
import javax.jws.WebService;

// Interface do serviço de agendamento
@WebService
public interface AgendamentoService {

    @WebMethod
    String consultarDisponibilidade(String data);

    @WebMethod
    String agendarServico(int clienteId, int servicoId, String data, String horaInicio);

    @WebMethod
    String cancelarAgendamento(int id);
}
