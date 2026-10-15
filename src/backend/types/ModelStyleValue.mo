/// OQL value instance for `ModelStyle`: renders the variant as its tag text
/// so the column is queryable and filterable by exact literal.
import OQL "mo:caffeineai-oql";
import Types "jobs";

module {
  public func _toRow(self : Types.ModelStyle) : OQL.Value =
    #text(
      switch (self) {
        case (#general) { "general" };
        case (#photo) { "photo" };
        case (#anime) { "anime" };
        case (#text) { "text" };
      }
    );
};
