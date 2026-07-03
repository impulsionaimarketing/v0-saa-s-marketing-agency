-- Demand <-> Production linking is now handled in application code
-- (see lib/data/productions.ts -> createLinkedProductionForDemand, called from
--  createDemand and convertItemToDemand).
--
-- The previous bidirectional triggers below caused an infinite recursion
-- (inserting a demand created a production, which created a demand, ...) and did
-- NOT set demand_id, so the records were never actually linked for two-way sync.
-- This script removes them to prevent duplicate/looping records.

DROP TRIGGER IF EXISTS trigger_sync_demand_to_production ON demands;
DROP TRIGGER IF EXISTS trigger_sync_production_to_demand ON productions;

DROP FUNCTION IF EXISTS sync_demand_to_production();
DROP FUNCTION IF EXISTS sync_production_to_demand();
