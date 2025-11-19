package com.agendeja.soap;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class Database {

    // Aponta para o banco Django REST (tabelas servicos e clientes já existem lá)
    private static final String URL = "jdbc:sqlite:../../agendeja_rest/db.sqlite3";

    public static Connection connect() throws SQLException {
        return DriverManager.getConnection(URL);
    }

    public static void ensureSchema() throws SQLException {
        try (Connection conn = connect(); Statement st = conn.createStatement()) {
            // Tabelas servicos_servico e servicos_cliente já existem no Django
            // Apenas criar agendamento se não existir
            st.executeUpdate(
                    "CREATE TABLE IF NOT EXISTS agendamento (" +
                            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                            "cliente_id INTEGER NOT NULL," +
                            "servico_id INTEGER NOT NULL," +
                            "data TEXT NOT NULL," +
                            "hora_inicio TEXT NOT NULL," +
                            "hora_fim TEXT NOT NULL," +
                            "status TEXT NOT NULL CHECK (status IN ('Confirmado','Cancelado')) DEFAULT 'Confirmado'," +
                            "created_at TEXT DEFAULT (datetime('now'))" +
                            ")"
            );
            st.executeUpdate("CREATE INDEX IF NOT EXISTS idx_agendamento_data ON agendamento(data)");
            st.executeUpdate("CREATE INDEX IF NOT EXISTS idx_agendamento_cliente ON agendamento(cliente_id)");
            st.executeUpdate("CREATE INDEX IF NOT EXISTS idx_agendamento_servico ON agendamento(servico_id)");
            st.executeUpdate(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ux_agendamento_unico " +
                            "ON agendamento(data, hora_inicio) WHERE status='Confirmado'"
            );
        }
    }
}
