package com.agendeja.soap;

import javax.xml.ws.Endpoint;

public class Server {
    public static void main(String[] args) {
        System.out.println("SOAP rodando...");
        
        try {
            Database.ensureSchema();
            System.out.println("Banco inicializado - tabela agendamento criada.");
        } catch (Exception e) {
            System.err.println("Erro ao inicializar banco: " + e.getMessage());
            e.printStackTrace();
        }
        
        Endpoint.publish("http://localhost:8088/soap/agendamento", new AgendamentoServiceImpl());
    }
}
