package ch.dfx.defichain.data.transaction;

import java.util.List;

import ch.dfx.common.PayoutManagerUtils;

/**
 * 
 */
public class DefiTransactionScriptPubKeyData {
  private String type = null;

  private List<String> addresses = null;

  /**
   * 
   */
  public DefiTransactionScriptPubKeyData() {
  }

  public List<String> getAddresses() {
    return addresses;
  }

  public void setAddresses(List<String> addresses) {
    this.addresses = addresses;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  @Override
  public String toString() {
    return PayoutManagerUtils.toJson(this);
  }
}
