ALTER TABLE "Position"
ADD CONSTRAINT position_nonnegative_shares
CHECK ("shares" >= 0);

ALTER TABLE "Outcome"
ADD CONSTRAINT outcome_nonnegative_shares
CHECK ("sharesOutstanding" >= 0);