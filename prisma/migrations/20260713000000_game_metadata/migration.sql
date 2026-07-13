-- Ajout non destructif de la provenance des métadonnées et jaquettes.
ALTER TABLE "Game"
  ADD COLUMN "metadataSource" TEXT,
  ADD COLUMN "metadataExternalId" TEXT,
  ADD COLUMN "metadataUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "coverUrl" TEXT,
  ADD COLUMN "coverSource" TEXT,
  ADD COLUMN "coverAttribution" TEXT;

