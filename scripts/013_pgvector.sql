-- Enable pgvector extension
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
alter extension vector set schema extensions;
