package com.gamecommentator.serialization;

import com.gamecommentator.models.Commentary;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.serialization.SerializationSchema;

public class CommentarySerializer implements SerializationSchema<Commentary> {
    private static final long serialVersionUID = 1L;
    private transient ObjectMapper mapper;

    private ObjectMapper getMapper() {
        if (mapper == null) mapper = new ObjectMapper();
        return mapper;
    }

    @Override
    public byte[] serialize(Commentary element) {
        try {
            return getMapper().writeValueAsBytes(element.toMap());
        } catch (Exception e) {
            return "{}".getBytes();
        }
    }
}
