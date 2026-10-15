/// OQL value instance for `UpscaleMode`: renders the variant as its tag text
/// so the column is queryable and filterable by exact literal.
import OQL "mo:caffeineai-oql";
import Types "jobs";

module {
  public func _toRow(self : Types.UpscaleMode) : OQL.Value =
    #text(
      switch (self) {
        case (#fast) { "fast" };
        case (#balanced) { "balanced" };
        case (#quality) { "quality" };
      }
    );
};
