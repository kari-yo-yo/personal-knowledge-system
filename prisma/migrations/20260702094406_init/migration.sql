-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TOPIC',
    "parentId" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL DEFAULT '{}',
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Content_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Edge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Edge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Node_parentId_sortOrder_idx" ON "Node"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "Content_nodeId_updatedAt_idx" ON "Content"("nodeId", "updatedAt");

-- CreateIndex
CREATE INDEX "Edge_sourceId_targetId_idx" ON "Edge"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Edge_sourceId_targetId_key" ON "Edge"("sourceId", "targetId");
