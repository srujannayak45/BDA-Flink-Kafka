package com.gamecommentator.serialization;

import com.gamecommentator.models.GameEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.serialization.DeserializationSchema;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.api.common.typeinfo.TypeHint;
import java.io.IOException;

public class GameEventDeserializer implements DeserializationSchema<GameEvent> {
    private static final long serialVersionUID = 1L;
    private transient ObjectMapper mapper;

    private ObjectMapper getMapper() {
        if (mapper == null) mapper = new ObjectMapper();
        return mapper;
    }

    @Override
    public GameEvent deserialize(byte[] message) throws IOException {
        try {
            return getMapper().readValue(message, GameEvent.class);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public boolean isEndOfStream(GameEvent nextElement) { return false; }

    @Override
    public TypeInformation<GameEvent> getProducedType() {
        return TypeInformation.of(new TypeHint<GameEvent>() {});
    }
}
