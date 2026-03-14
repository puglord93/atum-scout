-- CreateTable
CREATE TABLE "VentureCase" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "researcherId" INTEGER,
    "techOfferId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentureCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureInput" (
    "id" SERIAL NOT NULL,
    "ventureCaseId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VentureInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureSection" (
    "id" SERIAL NOT NULL,
    "ventureCaseId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "generatedAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "inputCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VentureSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureQuestion" (
    "id" SERIAL NOT NULL,
    "ventureCaseId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answered" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentureQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureAction" (
    "id" SERIAL NOT NULL,
    "ventureCaseId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentureAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VentureCase" ADD CONSTRAINT "VentureCase_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "researchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureCase" ADD CONSTRAINT "VentureCase_techOfferId_fkey" FOREIGN KEY ("techOfferId") REFERENCES "tech_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureInput" ADD CONSTRAINT "VentureInput_ventureCaseId_fkey" FOREIGN KEY ("ventureCaseId") REFERENCES "VentureCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureSection" ADD CONSTRAINT "VentureSection_ventureCaseId_fkey" FOREIGN KEY ("ventureCaseId") REFERENCES "VentureCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureQuestion" ADD CONSTRAINT "VentureQuestion_ventureCaseId_fkey" FOREIGN KEY ("ventureCaseId") REFERENCES "VentureCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureAction" ADD CONSTRAINT "VentureAction_ventureCaseId_fkey" FOREIGN KEY ("ventureCaseId") REFERENCES "VentureCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
