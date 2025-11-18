package com.agendeja.soap;

import javax.xml.ws.Endpoint;

public class Server {
    public static void main(String[] args) {
        System.out.println("SOAP rodando...");
        Endpoint.publish("http://localhost:8088/soap/agendamento", new AgendamentoServiceImpl());
    }
}
